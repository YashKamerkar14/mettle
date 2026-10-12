"""Score a reference run and write the report.

    python eval/analysis/analyze.py --results eval/results/v1 \
        --questions eval/questions/questions.v1.jsonl [--calibrate] [--make-subset PATH]

Writes report.md and summary.json into the results directory. The analysis
follows docs/analysis-plan.md; constants below mirror it and must not change
after the plan is frozen.

--calibrate      apply the pilot calibration rule
--make-subset    write the in-browser consistency subset chosen by the
                 pre-registered rule (needs q0f16 run 1)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from scoring import score
from stats import holm, mcnemar_exact, paired_bootstrap_diff, wilson

# Analysis-plan constants.
CALIBRATION_LOW, CALIBRATION_HIGH = 0.25, 0.95
CALIBRATION_BUILD = "q0f16"
PRIMARY = ("q0f16", "q4f16_1")
SECONDARY = [("q0f32", "q4f32_1")]
EQUIVALENCE_MARGIN = 0.05
SUBSET_BUILD = "q0f16"
SUBSET_PER_CATEGORY = 5
CHANCE = {"compare": 0.5, "sentiment": 0.5}


def short(build_id: str) -> str:
    m = re.search(r"-(q\d+f\d+(?:_\d+)?)-MLC$", build_id)
    return m.group(1) if m else build_id


def load_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def load_runs(results: Path, questions: dict[str, dict]) -> pd.DataFrame:
    rows = []
    for f in sorted(results.glob("*.run*.jsonl")):
        build_id, run = re.match(r"(.+)\.run(\d+)\.jsonl$", f.name).groups()
        answers = load_jsonl(f)
        margins = [m for a in answers for m in a["margins"]]
        if margins and all(m is None for m in margins):
            raise SystemExit(f"{f.name}: every log-prob margin is null; the run did not record margins")
        for a in answers:
            q = questions[a["id"]]
            s = score(a["text"], q)
            rows.append(
                {
                    "build": short(build_id),
                    "run": int(run),
                    "id": a["id"],
                    "category": q["category"],
                    "text": a["text"],
                    "tokens": a["tokens"],
                    "margins": a["margins"],
                    "truncated": a.get("finishReason") == "length",
                    "correct": s.correct,
                    "strict": s.strict,
                }
            )
    if not rows:
        raise SystemExit(f"no *.runN.jsonl files in {results}")
    return pd.DataFrame(rows)


def pct(x: float) -> str:
    return f"{100 * x:.1f}%"


def ci(lo: float, hi: float) -> str:
    return f"[{100 * lo:.1f}, {100 * hi:.1f}]"


def first_divergence(a: list[str], b: list[str]) -> int | None:
    for i, (x, y) in enumerate(zip(a, b)):
        if x != y:
            return i
    return None if len(a) == len(b) else min(len(a), len(b))


def min_margin(margins: list) -> float:
    vals = [m for m in margins if m is not None]
    return min(vals) if vals else float("inf")


def verdict(ci95: tuple[float, float], ci90: tuple[float, float], margin: float) -> str:
    """Pre-registered reading of the paired difference full - quantised."""
    significant = ci95[0] > 0 or ci95[1] < 0
    equivalent = ci90[0] > -margin and ci90[1] < margin
    if significant and ci95[0] > 0:
        return "loss, but within the equivalence margin" if equivalent else "loss"
    if significant:
        return "gain, but within the equivalence margin" if equivalent else "gain"
    return "equivalent" if equivalent else "inconclusive"


def compare_builds(first: pd.DataFrame, full: str, quant: str, categories: list[str], primary: bool) -> tuple[dict, list[str]]:
    a = first.loc[full]
    q = first.loc[quant].reindex(a.index)
    d, lo, hi = paired_bootstrap_diff(a["correct"].values, q["correct"].values, confidence=0.95)
    _, lo90, hi90 = paired_bootstrap_diff(a["correct"].values, q["correct"].values, confidence=0.90)
    mc = mcnemar_exact(a["correct"].values, q["correct"].values)
    ds, los, his = paired_bootstrap_diff(a["strict"].values, q["strict"].values)
    v = verdict((lo, hi), (lo90, hi90), EQUIVALENCE_MARGIN)

    div = [first_divergence(x, y) for x, y in zip(a["tokens"], q["tokens"])]
    div_idx = [i for i in div if i is not None]
    at_div = [m[i] for m, i in zip(a["margins"], div) if i is not None and i < len(m) and m[i] is not None]
    all_m = [x for m in a["margins"] for x in m if x is not None]

    out = {
        "full": full,
        "quant": quant,
        "diff": d,
        "ci95": [lo, hi],
        "ci90": [lo90, hi90],
        "verdict": v,
        "mcnemar": mc,
        "strict_diff": ds,
        "strict_ci95": [los, his],
        "identical_outputs": float(np.mean([i is None for i in div])),
        "median_divergence_token": float(np.median(div_idx)) if div_idx else None,
        "categories": {},
    }
    title = "Primary endpoint" if primary else "Secondary"
    md = [
        "",
        f"## {title}: {full} vs {quant}",
        "",
        f"- **Answer correct:** {full} − {quant} = **{100 * d:+.1f} points**, 95% CI {ci(lo, hi)}, "
        f"90% CI {ci(lo90, hi90)}, exact McNemar p = {mc['p']:.3g} "
        f"({mc['only_a']} right only in {full}, {mc['only_b']} right only in {quant})",
        f"- **Reading (±{100 * EQUIVALENCE_MARGIN:.0f}-point margin): {v}**",
        f"- **Followed format:** {100 * ds:+.1f} points, 95% CI {ci(los, his)}",
        f"- Identical outputs: {pct(out['identical_outputs'])}; where they differ, median first divergent token = "
        f"{out['median_divergence_token']}",
    ]
    if at_div and all_m:
        md.append(
            f"- {full}'s top-1 vs top-2 log-prob margin at the divergent token: median {np.median(at_div):.2f} "
            f"(all tokens: median {np.median(all_m):.2f})"
        )

    per_cat = []
    for c in categories:
        m = (a["category"] == c).values
        dc, lc, hc = paired_bootstrap_diff(a["correct"].values[m], q["correct"].values[m])
        per_cat.append((c, dc, lc, hc, mcnemar_exact(a["correct"].values[m], q["correct"].values[m])["p"]))
    adjusted = holm([p for *_, p in per_cat])
    md += [
        "",
        "Per category (exploratory; CIs are not adjusted for multiplicity, p-values are Holm-adjusted):",
        "",
        "| Category | Points lost | 95% CI | Holm p |",
        "| --- | --- | --- | --- |",
    ]
    for (c, dc, lc, hc, _), p_adj in zip(per_cat, adjusted):
        out["categories"][c] = {"diff": dc, "ci95": [lc, hc], "p_holm": p_adj}
        md.append(f"| {c} | {100 * dc:+.1f} | {ci(lc, hc)} | {p_adj:.3g} |")
    return out, md


def make_subset(first: pd.DataFrame, questions: dict[str, dict], path: Path) -> str:
    """Pre-registered rule: per category, the SUBSET_PER_CATEGORY items whose
    q0f16 run-1 output has the smallest minimum log-prob margin; ties by id."""
    r = first.loc[SUBSET_BUILD].copy()
    r["min_margin"] = r["margins"].map(min_margin)
    r = r.reset_index().sort_values(["category", "min_margin", "id"])
    chosen = r.groupby("category", sort=True).head(SUBSET_PER_CATEGORY)["id"].tolist()
    lines = [json.dumps(questions[i], ensure_ascii=False) for i in sorted(chosen)]
    data = ("\n".join(lines) + "\n").encode("utf-8")
    path.write_bytes(data)  # bytes, so the hash is the same on every OS
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to a legacy code page
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", type=Path, required=True)
    ap.add_argument("--questions", type=Path, required=True)
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--make-subset", type=Path)
    args = ap.parse_args()

    questions = {q["id"]: q for q in load_jsonl(args.questions)}
    meta = json.loads((args.results / "meta.json").read_text(encoding="utf-8"))
    df = load_runs(args.results, questions)
    builds = sorted(df["build"].unique())
    categories = sorted(df["category"].unique())
    first = df[df["run"] == 1].set_index(["build", "id"]).sort_index()
    summary: dict = {"meta": meta, "builds": {}, "comparisons": [], "determinism": {}}
    md: list[str] = []

    dev = meta["device"]
    md += [
        f"# Reference run: {args.results.name}",
        "",
        f"- Questions: `{meta['questions']}` ({len(questions)} items)",
        f"- Device: {dev['vendor']} {dev['architecture']}, {dev['browser']} on {dev['os']}",
        f"- WebLLM {meta['runtimeVersion']}, settings {json.dumps(meta['settings'])}",
        f"- Started {meta['startedAt']}",
        "- All accuracy figures use run 1; other runs are used only for determinism.",
        "",
        "## Same-device determinism",
        "",
        "| Build | Runs | Items identical across all runs | Mismatch rate |",
        "| --- | --- | --- | --- |",
    ]
    for b in builds:
        runs = df[df["build"] == b]
        run_ids = sorted(runs["run"].unique())
        if len(run_ids) < 2:
            md.append(f"| {b} | 1 | n/a | n/a |")
            continue
        by_run = [runs[runs["run"] == r].set_index("id")["tokens"] for r in run_ids]
        same = sum(all(s[i] == by_run[0][i] for s in by_run[1:]) for i in by_run[0].index)
        n = len(by_run[0])
        summary["determinism"][b] = {"runs": len(run_ids), "identical": same, "n": n}
        md.append(f"| {b} | {len(run_ids)} | {same}/{n} | {pct(1 - same / n)} |")

    md += [
        "",
        "## Accuracy (run 1)",
        "",
        "Answer correct = primary score; followed format = the whole first line is exactly the answer.",
        "",
        "| Build | Answer correct | 95% CI | Followed format | 95% CI | Truncated at max_tokens |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for b in builds:
        r = first.loc[b]
        n, k, ks, kt = len(r), int(r["correct"].sum()), int(r["strict"].sum()), int(r["truncated"].sum())
        summary["builds"][b] = {
            "n": n,
            "correct": k,
            "strict": ks,
            "truncated": kt,
            "ci95": wilson(k, n),
            "strict_ci95": wilson(ks, n),
        }
        md.append(
            f"| {b} | {pct(k / n)} | {ci(*wilson(k, n))} | {pct(ks / n)} | {ci(*wilson(ks, n))} | {kt}/{n} |"
        )

    md += [
        "",
        "### By category (answer correct)",
        "",
        "| Category | n | Chance | " + " | ".join(builds) + " |",
        "| --- | --- | --- |" + " --- |" * len(builds),
    ]
    for c in categories:
        n_c = int((first.loc[builds[0]]["category"] == c).sum())
        cells = [pct(first.loc[b][first.loc[b]["category"] == c]["correct"].mean()) for b in builds]
        chance = pct(CHANCE[c]) if c in CHANCE else "~0%"
        md.append(f"| {c} | {n_c} | {chance} | " + " | ".join(cells) + " |")

    for (full, quant), primary in [(PRIMARY, True)] + [(p, False) for p in SECONDARY]:
        if full in builds and quant in builds:
            comp, lines = compare_builds(first, full, quant, categories, primary)
            summary["comparisons"].append(comp)
            md += lines

    if args.calibrate:
        if CALIBRATION_BUILD not in builds:
            raise SystemExit(f"calibration needs {CALIBRATION_BUILD} results")
        r = first.loc[CALIBRATION_BUILD]
        md += [
            "",
            f"## Calibration ({CALIBRATION_BUILD}, keep if {pct(CALIBRATION_LOW)} <= accuracy <= {pct(CALIBRATION_HIGH)})",
            "",
            "| Category | Accuracy | Decision |",
            "| --- | --- | --- |",
        ]
        summary["calibration"] = {}
        for c in categories:
            acc = float(r[r["category"] == c]["correct"].mean())
            keep = CALIBRATION_LOW <= acc <= CALIBRATION_HIGH
            summary["calibration"][c] = {"accuracy": acc, "keep": keep}
            md.append(f"| {c} | {pct(acc)} | {'keep' if keep else 'drop'} |")

    if args.make_subset:
        digest = make_subset(first, questions, args.make_subset)
        summary["subset"] = {"path": str(args.make_subset), "sha256": digest}
        md += ["", "## Consistency subset", "", f"Wrote `{args.make_subset.name}`, SHA-256 `{digest}`."]

    md += [
        "",
        "## Outputs (run 1)",
        "",
        "| id | answer | " + " | ".join(builds) + " |",
        "| --- | --- |" + " --- |" * len(builds),
    ]
    for qid in first.loc[builds[0]].index:
        cells = []
        for b in builds:
            row = first.loc[(b, qid)]
            mark = "✓" if row["correct"] else "✗"
            cells.append(f"{mark} {row['text'][:50]!r}".replace("|", "\\|").replace("\n", " "))
        md.append(f"| {qid} | {questions[qid]['answers'][0]} | " + " | ".join(cells) + " |")

    # newline="\n" so reports are byte-identical on Windows and Linux.
    (args.results / "report.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    (args.results / "summary.json").write_text(
        json.dumps(summary, indent=2, default=float) + "\n", encoding="utf-8", newline="\n"
    )
    # The per-question table is long; it is in report.md.
    print("\n".join(md[: md.index("## Outputs (run 1)")]))


if __name__ == "__main__":
    main()
