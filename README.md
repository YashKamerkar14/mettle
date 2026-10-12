# Mettle

**Test your machine's mettle.** Mettle runs a small language model (SmolLM2-360M) on your own graphics chip through WebGPU, times it, and checks what compressing the model to 4-bit costs in answer quality. Everything runs in the browser.

**Live:** https://yashkamerkar14.github.io/mettle/

## Findings

From a [pre-registered](docs/analysis-plan.md) evaluation, frozen at tag `analysis-plan-v1-frozen` before any main-set output existed ([full write-up](docs/findings.md)):

| | Full precision | 4-bit | Difference |
| --- | --- | --- | --- |
| Generation speed (RTX 4080 Laptop, 10 sessions) | 113 tok/s | 128 tok/s | **1.12×** (95% CI 1.11–1.14) |
| Answer correct (500 questions) | 70.0% | 70.4% | **−0.4 pts** (95% CI −5.8 to +5.0; inconclusive) |
| Followed "answer with only …" | 48.0% | 8.6% | **−39.4 pts** |

- **The near-zero accuracy change hides large effects that cancel:** arithmetic −19 points, number comparison −17, capitals +21.
- **4-bit sometimes runs away on numbers:** 23 of 100 comparison answers became endless digit strings.
- **Compression flips the model's choice mostly where it was already undecided:** the median top-1 vs top-2 log-prob margin at the first differing token is 0.57, against 2.88 overall.
- **Same-device output is deterministic:** 500/500 identical across 4 browser launches per build, including an empty cache and the public site.
- **The scorer was audited blind:** 472 outputs judged without build labels, with 99.2% agreement for both builds and a 40/40 author spot-check.

## What's mine vs. what's a library

| Part | Source |
| --- | --- |
| Model runtime (WebGPU kernels, tokenizer) | [WebLLM](https://github.com/mlc-ai/web-llm) 0.2.86 |
| Instant score: tiled matrix multiply in WGSL, verified on the CPU | `web/src/gpu/` |
| Timing harness: warm-up, timed runs, five separate timings | `web/src/bench/` |
| Answer runner shared by the offline run and the in-browser check | `web/src/quality/` |
| Question generator (500 items, 5 categories) and pilot calibration | `eval/questions/` |
| Reference and speed runners (Playwright in real Chrome) | `eval/reference.mjs`, `eval/speed.mjs` |
| Scoring, statistics (Wilson, exact McNemar, paired bootstrap, Holm, TOST), blinded audit | `eval/analysis/` |
| Crowd dataset: RLS-locked Postgres table, anonymised view, edge function with Turnstile and rate limits | `supabase/` |

## Layout

```
web/        Vite + React + TypeScript site (WebGPU, model worker, harness, answer check, submit panel)
eval/       question set, Playwright runners, Python scoring and analysis, audit, results
supabase/   results table migration and the `submit` edge function
docs/       analysis plan (frozen), findings, methodology notes
```

## Running locally

```sh
cd web
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (Vitest)
```

End-to-end smoke test in real Chrome:

```sh
cd web && npm run build && npx vite preview --port 4173
# in another shell
cd eval && npm install
node smoke.mjs --full --compare      # add --dgpu on a dual-GPU laptop
```

## Reproducing the evaluation

Needs Chrome and Python 3.11.

```sh
cd web && npm run build && cd ..
node eval/reference.mjs --questions eval/questions/questions.v1.jsonl \
  --builds q0f16,q4f16_1,q0f32,q4f32_1 --out eval/results/v1 --dgpu
cd eval && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m pytest -q analysis
.venv/Scripts/python analysis/analyze.py --results results/v1 --questions questions/questions.v1.jsonl
```

`eval/results/README.md` describes every results folder, and `eval/freeze/manifest.json` pins the question set and model files by SHA-256.
