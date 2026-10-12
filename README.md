# Mettle

**Test your machine's mettle.** Mettle runs a small language model (SmolLM2-360M) on the visitor's own graphics chip through WebGPU and reports two things:

1. **How fast this device runs AI.** An instant GPU score with no download, then an opt-in full test: load time, time to first token, prompt reading speed and generation speed.
2. **What compressing the model costs.** 4-bit vs. full precision: how much speed it buys, how much answer accuracy it loses, and whether different devices give the same answers.

> Status: Week 1 (speed harness). Quality evaluation and the public leaderboard are next.

## What's mine vs. what's a library

| Part | Source |
| --- | --- |
| Model runtime (WebGPU kernels, tokenizer) | [WebLLM](https://github.com/mlc-ai/web-llm) |
| Instant score: tiled matmul in WGSL, CPU-verified | Mettle (`web/src/gpu/`) |
| Timing harness: warm-up, 3 timed runs, 5 separate timings | Mettle (`web/src/bench/harness.ts`) |
| Eval suite, reference runs, analysis | Mettle (`eval/`) |

## Layout

```
web/      Vite + React + TypeScript site (instant score, worker, harness)
eval/     Playwright tooling: smoke test now, offline reference runner next
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
