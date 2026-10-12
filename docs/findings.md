# Findings: 4-bit vs. full precision (v1)

Model: SmolLM2-360M-Instruct, WebLLM 0.2.86, 500 questions (`eval/questions/questions.v1.jsonl`). Reference device: RTX 4080 Laptop GPU, Chrome 154. Analysis follows the plan frozen at tag `analysis-plan-v1-frozen` before any main-set output existed. Raw outputs are in `eval/results/v1/` and the full report is in `eval/results/v1/report.md`.

## Headline

> **On this device, 4-bit was 1.12× as fast (95% CI 1.11–1.14). Compressing to 4-bit made no measurable difference to how often the answer was right (−0.4 points, 95% CI −5.8 to +5.0), but it cut how often the model followed "answer with only …" from 48.0% to 8.6% (−39.4 points, 95% CI −44.4 to −34.4).**

Under the pre-registered reading, the accuracy result is **inconclusive**, not "equivalent". The 90% CI (−5.0 to +4.0) touches the ±5-point margin, so equivalence can't be claimed at this sample size.

## What sits under the zero

The overall difference is near zero because large per-category effects cancel out (exploratory; Holm-adjusted p):

| Category | Full precision | 4-bit | Change from 4-bit | Holm p |
| --- | --- | --- | --- | --- |
| arithmetic | 90% | 71% | **−19 points** | 0.0003 |
| compare (chance 50%) | 52% | 35% | −17 points | 0.09 |
| capital | 64% | 85% | **+21 points** | 0.003 |
| sentiment (chance 50%) | 65% | 75% | +10 points | 0.24 |
| antonym | 79% | 86% | +7 points | 0.19 |

The f32 builds show the same pattern (arithmetic −12, compare −19, capital +22; overall −2.0, 95% CI −7.2 to +3.4).

- **Where 4-bit hurts: numbers.** 23 of 100 "which is larger/smaller" answers from 4-bit became runaway digit strings ("1000000000000000…") that were still running at 64 tokens. Full precision never did this.
- **Where 4-bit appears to help: capitals.** 4-bit answers in full sentences ("The capital of Australia is Canberra."), while full precision answers with a bare city name and is wrong more often ("Sydney"). One plausible explanation: the sentence form lets the model retrieve the fact in context rather than emit a single name immediately. This is a hypothesis, not something the data shows.
- **Full precision is no better than chance at compare (52%).** That category is noise-dominated for both builds and should not carry any conclusion.

## How robust this is

- **Scorer audit (blinded).** An independent judge labelled 472 outputs: every item where the builds disagreed, plus 50 random others per build. It saw no build labels and no scorer verdicts. Agreement with the scorer was 99.2% for both builds: 0 false passes, and 2 too-strict misses per build. With the judge's labels substituted, the primary difference is unchanged (−0.4 points). The author re-judged a random 40 of the judge's verdicts and agreed with all of them. See `eval/audit/audit.md`. Limitation: sentence-style answers partly reveal which build wrote them.
- **Truncation.** 25 of 4-bit's outputs hit the 16-token limit. Re-running them with 64 tokens leaves the result unchanged (−0.4 points). 24 were still cut off, which confirms they are runaway outputs, not answers that needed more room. See `eval/results/v1-trunc64/truncation.md`.
- **Determinism.** Each build gave identical tokens on 500/500 items across 4 runs: two cached launches, one with an empty cache, and one through the public site in a visible browser. Any difference between visitors' devices is therefore not same-device noise.

## Agreement between builds

The two builds produced identical output on only 18.8% of items. Where they differ, they usually diverge at the very first token. At that token, full precision's top-1 vs top-2 log-prob margin had a median of 0.57, against 2.88 across all tokens. Compression flips the model's choice mostly where full precision was already nearly undecided.

## Speed

**4-bit generates 1.12× as fast as full precision** (geometric mean of 10 sessions, 95% CI 1.11–1.14). Prompt reading is 1.20× (1.18–1.23). Measured on the reference device (RTX 4080 Laptop GPU, plugged in, Legion Balance Mode), ABBA order, cached weights, 5 idle minutes before each session (`eval/results/speed-v1/speed.md`).

The gain is small for a 4× smaller model. A 360M-parameter model on a high-end GPU is probably limited by per-token overhead more than by reading weights from memory; this protocol doesn't test that. Weaker or integrated GPUs may gain more, but that hasn't been measured. Four sessions were excluded and replaced because they broke the protocol's AC-power or idle conditions (see "Deviations" in the analysis plan).

## Not yet measured

- **Cross-device consistency:** the 25-item subset is fixed (`eval/questions/subset.v1.jsonl`, SHA-256 `65aacbb3…7082`) and ships with the site, which checks every visitor's answers against the reference device. Crowd submissions open with the leaderboard; under the plan, match rates are not examined until 150 valid submissions per build or 2027-01-31.

## Process notes

- One launch record in `eval/results/v1/launches.jsonl` (the 4th of 5) is a run-4 attempt that exited without writing outputs. It was re-run from scratch. No outputs were discarded.
- Author spot-check: the author re-judged 40 random blinded adjudications (seed 2) and agreed with all 40.
