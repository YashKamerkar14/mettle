"""Export the reference outputs the site compares visitors against.

    python eval/analysis/export_reference.py --results eval/results/v1 \
        --subset eval/questions/subset.v1.jsonl --out web/public/reference/subset.v1.json

For each of the 25 subset questions and each build: the reference device's
run-1 tokens, text and finish reason.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", type=Path, required=True)
    ap.add_argument("--subset", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    subset_bytes = args.subset.read_bytes()
    subset = [json.loads(l) for l in subset_bytes.decode("utf-8").splitlines() if l.strip()]
    ids = {q["id"] for q in subset}
    meta = json.loads((args.results / "meta.json").read_text(encoding="utf-8"))

    references: dict[str, dict] = {}
    for f in sorted(args.results.glob("*.run1.jsonl")):
        build = f.name.split(".run1.jsonl")[0]
        answers = [json.loads(l) for l in f.read_text(encoding="utf-8").splitlines() if l.strip()]
        references[build] = {
            a["id"]: {"tokens": a["tokens"], "text": a["text"], "finishReason": a["finishReason"]}
            for a in answers
            if a["id"] in ids
        }
        assert len(references[build]) == len(ids), f"{build} is missing subset items"

    out = {
        "version": 1,
        "subsetSha256": hashlib.sha256(subset_bytes).hexdigest(),
        "runtimeVersion": meta["runtimeVersion"],
        "settings": meta["settings"],
        "referenceDevice": f"{meta['device']['vendor']} {meta['device']['architecture']}, {meta['device']['browser']}",
        "questions": [{"id": q["id"], "category": q["category"], "prompt": q["prompt"]} for q in subset],
        "references": references,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(subset)} questions x {len(references)} builds -> {args.out} ({args.out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
