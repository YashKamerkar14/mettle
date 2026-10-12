"""Speed analysis (docs/analysis-plan.md, "Speed").

    python eval/analysis/speed.py --results eval/results/speed-v1

Only valid sessions count: on AC power before and after the run (flagged by
eval/speed.mjs), and not listed in excluded.json in the results directory,
which records exclusions with reasons for sessions run before the runner
checked power afterwards.

Per session: median 4-bit decode tok/s over its timed runs (both A blocks)
divided by the same for full precision (both B blocks). Across sessions:
geometric mean of the ratios with a t-interval on the log ratios. Prefill is
secondary and computed the same way.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from scipy.stats import t

QUANT, FULL = "q4f16_1", "q0f16"


def session_ratio(session: dict, metric: str) -> float:
    def runs(build: str) -> list[float]:
        return [r[metric] for b in session["blocks"] if b["build"] == build for r in b["runs"]]

    return float(np.median(runs(QUANT)) / np.median(runs(FULL)))


def geo_ci(ratios: list[float], confidence: float = 0.95) -> tuple[float, float, float]:
    logs = np.log(ratios)
    n = len(logs)
    mean = logs.mean()
    if n < 2:
        return float(np.exp(mean)), float("nan"), float("nan")
    half = t.ppf(1 - (1 - confidence) / 2, n - 1) * logs.std(ddof=1) / np.sqrt(n)
    return float(np.exp(mean)), float(np.exp(mean - half)), float(np.exp(mean + half))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", type=Path, required=True)
    args = ap.parse_args()
    recorded = [json.loads(l) for l in (args.results / "sessions.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    excluded_path = args.results / "excluded.json"
    excluded = json.loads(excluded_path.read_text(encoding="utf-8")) if excluded_path.exists() else {}
    for s in recorded:
        if s.get("valid") is False and str(s["session"]) not in excluded:
            excluded[str(s["session"])] = "power changed during the run (flagged by the runner)"
    sessions = [s for s in recorded if str(s["session"]) not in excluded]

    md = [
        "# Speed: 4-bit vs full precision",
        "",
        f"{len(sessions)} sessions on {sessions[0]['device']['vendor']} {sessions[0]['device']['architecture']}, "
        f"WebLLM {sessions[0]['runtimeVersion']}, ABBA order, power plan: "
        + ", ".join(sorted({s['power']['scheme'] for s in sessions}))
        + ".",
        "",
        *(
            ["Excluded: " + "; ".join(f"session {k}: {v}" for k, v in sorted(excluded.items(), key=lambda kv: int(kv[0]))) + ".", ""]
            if excluded
            else []
        ),
        "| Session | 4-bit decode | Full decode | Decode ratio | Prefill ratio |",
        "| --- | --- | --- | --- | --- |",
    ]
    dec, pre = [], []
    for s in sessions:
        q = np.median([r["decodeTokPerSec"] for b in s["blocks"] if b["build"] == QUANT for r in b["runs"]])
        f = np.median([r["decodeTokPerSec"] for b in s["blocks"] if b["build"] == FULL for r in b["runs"]])
        dr, pr = session_ratio(s, "decodeTokPerSec"), session_ratio(s, "prefillTokPerSec")
        dec.append(dr)
        pre.append(pr)
        md.append(f"| {s['session']} | {q:.1f} tok/s | {f:.1f} tok/s | {dr:.2f}× | {pr:.2f}× |")

    g, lo, hi = geo_ci(dec)
    gp, lop, hip = geo_ci(pre)
    md += [
        "",
        f"**Generation: 4-bit is {g:.2f}× as fast as full precision** (geometric mean, 95% CI {lo:.2f}–{hi:.2f}).",
        f"Prompt reading (secondary): {gp:.2f}× (95% CI {lop:.2f}–{hip:.2f}).",
    ]
    (args.results / "speed.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("\n".join(md))


if __name__ == "__main__":
    main()
