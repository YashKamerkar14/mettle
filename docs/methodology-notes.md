# Methodology notes

Working notes that will become the public methodology page.

## Speed timings

- One warm-up generation, then three timed generations. Each starts from an empty KV cache (`resetChat`), uses the same 458-token prompt (`web/src/bench/prompt.ts`), greedy decoding, and exactly 128 output tokens (`ignore_eos`).
- **Time to first token** is measured from sending the request to the first streamed chunk, on the main thread. It includes worker message latency; WebLLM's internal figure is recorded alongside for comparison. On the first test devices the two agree within about 1–4%.
- **Prompt reading speed** = prompt tokens / time to first token.
- **Generation speed** = (output tokens − 1) / time from first to last token.
- **Download vs. load** is split at WebLLM's first "Loading model from cache" progress report. A cache hit is detected with `hasModelInCache` before loading and reported as "cached" rather than as a fast download.

## Model sizes

The f32 fallback builds are stored on the hub as bf16 (`format: f32-to-bf16` in `tensor-cache.json`) and widened on load. Both 4-bit builds download about 204 MB and both full-precision builds about 724 MB; only graphics memory use differs.

## Instant score

Tiled 16×16 f32 matrix multiply, N = 1024, inputs from a fixed seed. Batches of dispatches are sized to about 60 ms each; 7 batches are timed with `performance.now()` around `queue.onSubmittedWorkDone()`. 32 random output cells are recomputed on the CPU in float64; the score is marked unverified if any differs by 0.01 or more.

## Dual-GPU laptops

On Windows, Chrome uses the **integrated** GPU by default even when the page asks for `powerPreference: 'high-performance'`. On the author's laptop (AMD Radeon 610M + RTX 4080 Laptop):

| GPU used | Instant score | Generation (4-bit) | Prompt reading |
| --- | --- | --- | --- |
| Radeon 610M (default) | 76 GFLOPS | 21.8 tok/s | 160 tok/s |
| RTX 4080 Laptop (`--force_high_performance_gpu`) | 1,718 GFLOPS | 112.9 tok/s | 6,050 tok/s |

Results are grouped by the adapter the browser actually reported, not by the machine. The page shows dual-GPU visitors how to switch (Windows: Settings → Display → Graphics → the browser → High performance).

## Session-to-session variation

Repeated runs within one session agree closely, but separate sessions on the same device do not. Two sessions on the RTX 4080 Laptop GPU gave 112.9 and 89.6 tok/s median generation, a 21% gap, while the spread within each session was under 7%. Likely causes are GPU power state, laptop power mode, and background load. A single visitor result is therefore one sample of the device, not its true speed. The leaderboard shows distributions per device class, and "verified" seed rows should come from several sessions.

## Quality runs

- Every question runs from an empty conversation with greedy decoding, `max_tokens` 16, and top-2 log-probs recorded per token (`web/src/quality/runQuestions.ts`). The offline reference runner and the in-browser check use this same function.
- On the reference device, two runs of each f16 build produced identical tokens on 48/48 pilot items, so any cross-device difference is not same-device noise.
- In the pilot, the 4-bit build answered in full sentences much more often ("The capital of Iceland is Reykjavik.") while matching full precision on whether the answer was right. See `docs/analysis-plan.md` for how scoring separates the two.
