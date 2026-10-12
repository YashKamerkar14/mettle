"""Score a reference run and write the report.

    python eval/analysis/analyze.py --results eval/results/pilot \
        --questions eval/questions/pilot.v1.jsonl [--calibrate]

Writes report.md and summary.json into the results directory. With
--calibrate, also applies the pilot calibration rule from the analysis plan.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

from scoring import score
from stats import holm, mcnemar_exact, paired_bootstrap_diff, wilson

# Analysis-plan constants.
CALIBRATION_LOW, CALIBRATION_HIGH = 0.25, 0.95
CALIBRATION_BUILD = "q0f16"
COMPARISONS = [("q0f16", "q4f16_1"), ("q0f32", "q4f32_1")]


def short(build_id: str) -> str:
    m = re.search(r"-(q\d+f\d+(?:_\d+)?)-MLC$", build_id)
    return m.group(1) if m else build_id


def load_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def load_runs(results: Path, questions: dict[str, dict]) -> pd.DataFrame:
    rows = []
    for f in sorted(results.glob("*.run*.jsonl")):
        build_id, run = re.match(r"(.+)\.run(\d+)\.jsonl$", f.name).groups()
        for a in load_jsonl(f):
            q = questions[a["id"]]
            s = score(a["text"], q)
            rows.append(
                {
                    "build": short(build_id),
                    "run": int(run),
                    "id": a["id"],
                    "category": q["category"],
                    "subtype": q["subtype"],
                    "text": a["text"],
                    "tokens": a["tokens"],
                    "margins": a["margins"],
                    "extracted": s.extracted,
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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", type=Path, required=True)
    ap.add_argument("--questions", type=Path, required=True)
    ap.add_argument("--calibrate", action="store_true")
    args = ap.parse_args()

    questions = {q["id"]: q for q in load_jsonl(args.questions)}
    meta = json.loads((args.results / "meta.json").read_text(encoding="utf-8"))
    df = load_runs(args.results, questions)
    builds = sorted(df["build"].unique())
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
        "",
        "## Same-device determinism",
        "",
        "| Build | Runs | Identical outputs across runs |",
        "| --- | --- | --- |",
    ]
    for b in builds:
        runs = df[df["build"] == b]
        n_runs = runs["run"].nunique()
        if n_runs < 2:
            md.append(f"| {b} | 1 | n/a |")
            continue
        by_run = [runs[runs["run"] == r].set_index("id")["tokens"] for r in sorted(runs["run"].unique())]
        same = sum(all(s[i] == by_run[0][i] for s in by_run[1:]) for i in by_run[0].index)
        summary["determinism"][b] = {"runs": n_runs, "identical": same, "n": len(by_run[0])}
        md.append(f"| {b} | {n_runs} | {same}/{len(by_run[0])} |")

    md += [
        "",
        "## Accuracy (run 1)",
        "",
        "Primary = answer extracted from the first line; strict = whole first line is exactly the answer.",
        "",
        "| Build | Primary | 95% CI | Strict | 95% CI |",
        "| --- | --- | --- | --- | --- |",
    ]
    for b in builds:
        r = first.loc[b]
        n, k, ks = len(r), int(r["correct"].sum()), int(r["strict"].sum())
        summary["builds"][b] = {"n": n, "correct": k, "strict": ks, "ci": wilson(k, n), "strict_ci": wilson(ks, n)}
        md.append(f"| {b} | {pct(k / n)} | {ci(*wilson(k, n))} | {pct(ks / n)} | {ci(*wilson(ks, n))} |")

    categories = sorted(df["category"].unique())
    md += ["", "### By category (primary)", "", "| Category | n | " + " | ".join(builds) + " |", "| --- | --- |" + " --- |" * len(builds)]
    for c in categories:
        cells = []
        for b in builds:
            r = first.loc[b]
            r = r[r["category"] == c]
            cells.append(pct(r["correct"].mean()))
        md.append(f"| {c} | {len(first.loc[builds[0]].query('category == @c'))} | " + " | ".join(cells) + " |")

    for full, quant in COMPARISONS:
        if full not in builds or quant not in builds:
            continue
        a, q = first.loc[full], first.loc[quant].reindex(first.loc[full].index)
        d, lo, hi = paired_bootstrap_diff(a["correct"].values, q["correct"].values)
        mc = mcnemar_exact(a["correct"].values, q["correct"].values)
        ds, los, his = paired_bootstrap_diff(a["strict"].values, q["strict"].values)
        comp = {"full": full, "quant": quant, "diff": d, "ci": [lo, hi], "mcnemar": mc, "strict_diff": ds, "strict_ci": [los, his], "categories": {}}

        per_cat = []
        for c in categories:
            m = a["category"] == c
            dc, lc, hc = paired_bootstrap_diff(a["correct"][m].values, q["correct"][m].values)
            per_cat.append((c, dc, lc, hc, mcnemar_exact(a["correct"][m].values, q["correct"][m].values)["p"]))
        adjusted = holm([p for *_, p in per_cat])

        same = [first_divergence(x, y) is None for x, y in zip(a["tokens"], q["tokens"])]
        div = [first_divergence(x, y) for x, y in zip(a["tokens"], q["tokens"])]
        div_idx = [i for i in div if i is not None]
        margins = [m[i] for m, i in zip(a["margins"], div) if i is not None and i < len(m) and m[i] is not None]
        comp["identical_outputs"] = float(np.mean(same))
        comp["median_divergence_token"] = float(np.median(div_idx)) if div_idx else None

        md += [
            "",
            f"## Compression: {full} vs {quant}",
            "",
            f"- Accuracy lost (primary): **{100 * d:+.1f} points**, 95% CI {ci(lo, hi)}, McNemar p = {mc['p']:.3g} "
            f"({mc['only_a']} right only in {full}, {mc['only_b']} right only in {quant})",
            f"- Accuracy lost (strict): {100 * ds:+.1f} points, 95% CI {ci(los, his)}",
            f"- Identical outputs: {pct(comp['identical_outputs'])}; where they differ, median first divergent token = "
            f"{comp['median_divergence_token']}",
        ]
        if margins:
            md.append(
                f"- {full}'s top-1 vs top-2 log-prob margin at the divergent token: median {np.median(margins):.2f} "
                f"(all tokens: median {np.median([x for m in a['margins'] for x in m if x is not None]):.2f})"
            )
        md += ["", "| Category | Points lost | 95% CI | Holm p |", "| --- | --- | --- | --- |"]
        for (c, dc, lc, hc, _), p_adj in zip(per_cat, adjusted):
            comp["categories"][c] = {"diff": dc, "ci": [lc, hc], "p_holm": p_adj}
            md.append(f"| {c} | {100 * dc:+.1f} | {ci(lc, hc)} | {p_adj:.3g} |")
        summary["comparisons"].append(comp)

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

    md += ["", "## Outputs (run 1)", "", "| id | answer | " + " | ".join(builds) + " |", "| --- | --- |" + " --- |" * len(builds)]
    for qid in first.loc[builds[0]].index:
        cells = []
        for b in builds:
            row = first.loc[(b, qid)]
            mark = "✓" if row["correct"] else "✗"
            cells.append(f"{mark} {row['text'][:50]!r}".replace("|", "\\|").replace("\n", " "))
        md.append(f"| {qid} | {questions[qid]['answers'][0]} | " + " | ".join(cells) + " |")

    (args.results / "report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    (args.results / "summary.json").write_text(json.dumps(summary, indent=2, default=float) + "\n", encoding="utf-8")
    print("\n".join(line for line in md if not line.startswith("| p") and not line.startswith("| q")))


if __name__ == "__main__":
    main()
