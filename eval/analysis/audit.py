"""Blinded scorer-validity audit (docs/analysis-plan.md, "Scorer validity audit").

    python eval/analysis/audit.py prepare --results eval/results/v1 \
        --questions eval/questions/questions.v1.jsonl --out eval/audit --key KEY.json
    python eval/analysis/audit.py score --results eval/results/v1 \
        --questions eval/questions/questions.v1.jsonl --out eval/audit --key KEY.json

prepare: every item where q0f16 and q4f16_1 disagree on "answer correct"
(both outputs), plus 50 random other items per build (seed 1). Writes
items.jsonl (shuffled, anonymous ids, no build label, no scorer verdict) to
--out, and the id -> (build, item, scorer verdict) key to --key. Keep the key
away from the adjudicator until labels.jsonl exists.

score: reads <out>/labels.jsonl ({"audit_id", "correct"}) and the key, and
writes audit.md: scorer error rates per build and the primary difference with
adjudicated labels substituted.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np

from analyze import PRIMARY, load_jsonl, load_runs
from stats import mcnemar_exact, paired_bootstrap_diff

SEED = 1
RANDOM_PER_BUILD = 50


def first_runs(results: Path, questions_path: Path):
    questions = {q["id"]: q for q in load_jsonl(questions_path)}
    df = load_runs(results, questions)
    first = df[df["run"] == 1].set_index(["build", "id"]).sort_index()
    return questions, first


def prepare(args) -> None:
    questions, first = first_runs(args.results, args.questions)
    full, quant = PRIMARY
    a, q = first.loc[full], first.loc[quant]
    discordant = sorted(i for i in a.index if a.loc[i, "correct"] != q.loc[i, "correct"])

    rng = random.Random(SEED)
    picks = [(b, i) for i in discordant for b in (full, quant)]
    others = sorted(set(a.index) - set(discordant))
    for b in (full, quant):
        picks += [(b, i) for i in rng.sample(others, RANDOM_PER_BUILD)]

    rng.shuffle(picks)
    items, key = [], {}
    for n, (b, i) in enumerate(picks):
        aid = f"a{n:04d}"
        row = first.loc[(b, i)]
        qq = questions[i]
        items.append({"audit_id": aid, "question": qq["prompt"], "accepted_answers": qq["answers"], "output": row["text"]})
        key[aid] = {"build": b, "id": i, "scorer_correct": bool(row["correct"]), "discordant": i in discordant}

    args.out.mkdir(parents=True, exist_ok=True)
    with (args.out / "items.jsonl").open("w", encoding="utf-8", newline="\n") as f:
        for it in items:
            f.write(json.dumps(it, ensure_ascii=False) + "\n")
    args.key.write_text(json.dumps(key, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(items)} audit items ({len(discordant)} discordant questions) -> {args.out / 'items.jsonl'}")


def score(args) -> None:
    questions, first = first_runs(args.results, args.questions)
    key = json.loads(args.key.read_text(encoding="utf-8"))
    labels = {r["audit_id"]: bool(r["correct"]) for r in load_jsonl(args.out / "labels.jsonl")}
    missing = set(key) - set(labels)
    if missing:
        raise SystemExit(f"{len(missing)} audit items have no label")

    full, quant = PRIMARY
    md = ["# Scorer validity audit", "", f"{len(key)} outputs judged blind (no build label, no scorer verdict).", ""]
    md += ["| Build | Audited | Scorer said correct, judge said wrong | Scorer said wrong, judge said correct | Agreement |",
           "| --- | --- | --- | --- | --- |"]
    adjudicated = {b: first.loc[b]["correct"].copy() for b in (full, quant)}
    for b in (full, quant):
        rows = [(k, v) for k, v in key.items() if v["build"] == b]
        fp = sum(v["scorer_correct"] and not labels[k] for k, v in rows)
        fn = sum(not v["scorer_correct"] and labels[k] for k, v in rows)
        pos = sum(v["scorer_correct"] for _, v in rows)
        neg = len(rows) - pos
        md.append(f"| {b} | {len(rows)} | {fp}/{pos} | {fn}/{neg} | {100 * (1 - (fp + fn) / len(rows)):.1f}% |")
        for k, v in rows:
            adjudicated[b].loc[v["id"]] = labels[k]

    a, q = adjudicated[full].sort_index(), adjudicated[quant].sort_index()
    d, lo, hi = paired_bootstrap_diff(a.values, q.values)
    orig = first.loc[full]["correct"].mean() - first.loc[quant]["correct"].mean()
    mc = mcnemar_exact(a.values, q.values)
    outside = not (lo <= orig <= hi)
    md += [
        "",
        f"Primary difference {full} − {quant} with adjudicated labels substituted on audited items: "
        f"**{100 * d:+.1f} points**, 95% CI [{100 * lo:.1f}, {100 * hi:.1f}], McNemar p = {mc['p']:.3g} "
        f"(scorer-based: {100 * orig:+.1f}).",
        "",
        "Per category with adjudicated labels:",
        "",
        "| Category | Points lost (adjudicated) |",
        "| --- | --- |",
    ]
    cats = first.loc[full]["category"]
    for c in sorted(cats.unique()):
        m = (cats == c).values
        md.append(f"| {c} | {100 * (a.values[m].mean() - q.values[m].mean()):+.1f} |")
    (args.out / "audit.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("\n".join(md))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["prepare", "score"])
    ap.add_argument("--results", type=Path, required=True)
    ap.add_argument("--questions", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--key", type=Path, required=True)
    args = ap.parse_args()
    prepare(args) if args.command == "prepare" else score(args)


if __name__ == "__main__":
    main()
