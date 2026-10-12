"""Author spot-check of the blinded adjudications (docs/analysis-plan.md).

    python eval/analysis/spotcheck.py prepare   # writes eval/audit/spotcheck.md
    python eval/analysis/spotcheck.py score     # reads your ticks, writes the agreement rate

prepare samples 40 adjudicated items (seed 2) and lists each with the judge's
verdict but no build label. Tick "Agree" or "Disagree" for each; score counts
them and appends the result to eval/audit/audit.md.
"""

from __future__ import annotations

import json
import random
import re
import sys
from pathlib import Path

AUDIT = Path(__file__).resolve().parent.parent / "audit"
N, SEED = 40, 2


def prepare() -> None:
    items = {r["audit_id"]: r for r in map(json.loads, (AUDIT / "items.jsonl").read_text(encoding="utf-8").splitlines())}
    labels = {r["audit_id"]: r for r in map(json.loads, (AUDIT / "labels.jsonl").read_text(encoding="utf-8").splitlines())}
    picks = random.Random(SEED).sample(sorted(items), N)
    md = [
        "# Spot-check the blind judge",
        "",
        "For each item, decide whether the judge's verdict is right. Only the **first line** of the model output counts,",
        "and format doesn't matter (\"The capital is X.\" is as good as \"X\"). Valid alternatives to the listed answers count.",
        "",
        "Tick exactly one box per item by changing `[ ]` to `[x]`, save, then run:",
        "`eval/.venv/Scripts/python eval/analysis/spotcheck.py score`",
        "",
    ]
    for n, aid in enumerate(picks, 1):
        it, lab = items[aid], labels[aid]
        output = it["output"].strip().splitlines()[0] if it["output"].strip() else "(empty)"
        md += [
            f"## {n}. `{aid}`",
            "",
            "**Question:** " + it["question"].replace("\n", " / "),
            "",
            "**Listed answers:** " + ", ".join(it["accepted_answers"]),
            "",
            f"**Model output (first line):** `{output}`",
            "",
            f"**Judge says:** {'CORRECT' if lab['correct'] else 'WRONG'}",
            "",
            "- [ ] Agree",
            "- [ ] Disagree",
            "",
        ]
    (AUDIT / "spotcheck.md").write_text("\n".join(md), encoding="utf-8", newline="\n")
    print(f"{N} items -> {AUDIT / 'spotcheck.md'}")


def score() -> None:
    text = (AUDIT / "spotcheck.md").read_text(encoding="utf-8")
    blocks = re.split(r"\n## \d+\. ", text)[1:]
    agree = disagree = blank = 0
    disagreed = []
    for b in blocks:
        a = re.search(r"- \[[xX]\] Agree", b) is not None
        d = re.search(r"- \[[xX]\] Disagree", b) is not None
        if a == d:
            blank += 1
        elif a:
            agree += 1
        else:
            disagree += 1
            disagreed.append(b.split("`")[1])
    if blank:
        raise SystemExit(f"{blank} items have no tick or both ticks; fix them and rerun")
    line = (
        f"\n## Author spot-check\n\nThe author re-judged {agree + disagree} random adjudications (seed {SEED}) "
        f"and agreed with {agree} ({100 * agree / (agree + disagree):.0f}%)."
        + (f" Disagreed on: {', '.join(disagreed)}." if disagreed else "")
        + "\n"
    )
    audit = AUDIT / "audit.md"
    body = audit.read_text(encoding="utf-8").split("\n## Author spot-check")[0].rstrip("\n") + "\n"
    audit.write_text(body + line, encoding="utf-8", newline="\n")
    print(line.strip())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    {"prepare": prepare, "score": score}[sys.argv[1] if len(sys.argv) > 1 else "prepare"]()
