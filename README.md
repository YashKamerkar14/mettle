# Mettle

**Test your machine's mettle.** Mettle runs a small language model (SmolLM2-360M) on the visitor's own graphics chip through WebGPU and reports two things:

1. **How fast this device runs AI.** An instant GPU score with no download, then an opt-in full test: load time, time to first token, prompt reading speed and generation speed.
2. **What compressing the model costs.** 4-bit vs. full precision: how much speed it buys, how much answer accuracy it loses, and whether different devices give the same answers.

> **First result** ([findings](docs/findings.md)): on 500 questions, 4-bit compression did not change how often SmolLM2-360M got the answer right (−0.4 points, 95% CI −5.8 to +5.0), but it cut how often the model followed "answer with only …" from 48% to 9%. It lost 19 points on arithmetic and gained 21 on capitals. The analysis was [pre-registered](docs/analysis-plan.md) and frozen before the run, and the scorer was checked by a blinded audit.
>
> Live at **https://yashkamerkar14.github.io/mettle/**. Next: speed ratio, the in-browser consistency check, and the public leaderboard.

## What's mine vs. what's a library

| Part | Source |
| --- | --- |
| Model runtime (WebGPU kernels, tokenizer) | [WebLLM](https://github.com/mlc-ai/web-llm) |
| Instant score: tiled matmul in WGSL, CPU-verified | Mettle (`web/src/gpu/`) |
| Timing harness: warm-up, 3 timed runs, 5 separate timings | Mettle (`web/src/bench/harness.ts`) |
| Question set generator (500 items, 5 categories) | Mettle (`eval/questions/`) |
| Answer runner shared by offline and in-browser checks | Mettle (`web/src/quality/`) |
| Scoring, statistics (Wilson, McNemar, paired bootstrap, Holm), reports | Mettle (`eval/analysis/`) |

## Layout

```
web/      Vite + React + TypeScript site (instant score, worker, harness)
eval/     question set, Playwright reference runner, Python scoring and analysis
docs/     analysis plan (pre-registered) and methodology notes
```

## Running locally

```sh
cd web
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests
```

End-to-end smoke test in real Chrome (needs Chrome installed):

```sh
cd web && npm run build && npx vite preview --port 4173
# in another shell
cd eval && npm install
node smoke.mjs --full          # add --dgpu on a dual-GPU laptop
```

Offline reference run and analysis (needs Chrome and Python 3.11):

```sh
cd web && npm run build && cd ..
node eval/reference.mjs --questions eval/questions/questions.v1.jsonl   --builds q0f16,q4f16_1,q0f32,q4f32_1 --repeat 2 --dgpu --out eval/results/v1
cd eval && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python analysis/analyze.py --results results/v1 --questions questions/questions.v1.jsonl
```
