"""Truncation sensitivity (docs/analysis-plan.md, secondary analyses).

    python eval/analysis/truncation.py prepare --results eval/results/v1 \
        --questions eval/questions/questions.v1.jsonl --out eval/results/v1-trunc64
    node eval/reference.mjs --questions eval/results/v1-trunc64/questions.jsonl \
        --builds q4f16_1,q0f16 --out eval/results/v1-trunc64 --dgpu
    python eval/analysis/truncation.py score ...same args...

Items that stopped at max_tokens 16 in run 1 of either f16 build are re-run
with max_tokens 64 on both builds. Greedy decoding means the first 16 tokens
are unchanged, so this only lets cut-off answers finish. The primary
difference is then recomputed with the re-run outputs substituted.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from analyze import PRIMARY, load_jsonl, load_runs, short
from scoring import score
from stats import mcnemar_exact, paired_bootstrap_diff

MAX_TOKENS = 64


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["prepare", "score"])
    ap.add_argument("--results", type=Path, required=True)
    ap.add_argument("--questions", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    questions = {q["id"]: q for q in load_jsonl(args.questions)}
    df = load_runs(args.results, questions)
    first = df[df["run"] == 1].set_index(["build", "id"]).sort_index()
    truncated = sorted({i for b in PRIMARY for i in first.loc[b].index if first.loc[(b, i)]["truncated"]})

    if args.command == "prepare":
        args.out.mkdir(parents=True, exist_ok=True)
        with (args.out / "questions.jsonl").open("w", encoding="utf-8", newline="\n") as f:
            for i in truncated:
                f.write(json.dumps({**questions[i], "max_tokens": MAX_TOKENS}, ensure_ascii=False) + "\n")
        print(f"{len(truncated)} truncated items -> {args.out / 'questions.jsonl'}")
        return

    reruns = {}
    for f in args.out.glob("*.run1.jsonl"):
        build = short(f.name.split(".run")[0])
        for a in load_jsonl(f):
            reruns[(build, a["id"])] = a
    full, quant = PRIMARY
    correct = {b: first.loc[b]["correct"].copy() for b in PRIMARY}
    still_cut = {b: 0 for b in PRIMARY}
    for (b, i), a in reruns.items():
        correct[b].loc[i] = score(a["text"], questions[i]).correct
        still_cut[b] += a.get("finishReason") == "length"
    d, lo, hi = paired_bootstrap_diff(correct[full].values, correct[quant].values)
    orig = first.loc[full]["correct"].mean() - first.loc[quant]["correct"].mean()
    mc = mcnemar_exact(correct[full].values, correct[quant].values)
    md = [
        "# Truncation sensitivity",
        "",
        f"{len(truncated)} items stopped at max_tokens 16 in run 1 of {full} or {quant}; re-run with max_tokens {MAX_TOKENS}.",
        f"Still cut off at {MAX_TOKENS}: " + ", ".join(f"{b} {still_cut[b]}" for b in PRIMARY) + ".",
        "",
        f"Primary difference {full} − {quant} with re-run outputs substituted: **{100 * d:+.1f} points**, "
        f"95% CI [{100 * lo:.1f}, {100 * hi:.1f}], McNemar p = {mc['p']:.3g} (original: {100 * orig:+.1f}).",
    ]
    (args.out / "truncation.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("\n".join(md))


if __name__ == "__main__":
    main()
