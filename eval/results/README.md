# Results

Raw outputs, reports and logs from every run. Nothing here is edited by hand except `speed-v1/excluded.json`, which records why sessions were excluded.

| Folder | What it is | Status |
| --- | --- | --- |
| `pilot/` | First pilot (48 items, q0f16 and q4f16_1, two runs each), decoded at temperature 0. | **Superseded.** At temperature 0, WebLLM's log-prob margins are all infinite (stored as `null`), so the current `analyze.py` refuses this folder. Kept as the record behind the calibration decision; `report.md` here was made with the scorer of that time. |
| `pilot-topp/` | The same pilot re-run with the frozen greedy setting (temperature 1, top-p 1e-5). | Token-identical to `pilot/` on all 48 items, with real margins. Scored with the frozen scorer. |
| `v1/` | **Main reference run**: 500 questions × 4 builds × 4 runs (two cached launches, one fresh profile, one through the public site). | Primary results: `report.md`, `summary.json`. `launches.jsonl` records device, settings and model-file hashes for each launch. |
| `v1-trunc64/` | Items that stopped at 16 tokens, re-run with 64. | Truncation sensitivity analysis (`truncation.md`). |
| `speed-v1/` | 14 speed sessions (ABBA order) on the reference device. | 10 valid; sessions 3–6 excluded, with reasons in `excluded.json`. Analysis in `speed.md`. |

The blinded scorer audit lives in `eval/audit/`, and the pinned input hashes in `eval/freeze/manifest.json`.
