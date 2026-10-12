# Analysis plan (pre-registered)

**Status: DRAFT. Freeze this file (commit, then do not edit) before running the offline reference evaluation in Week 2.** Any later change goes in a dated "Deviations" section at the bottom, with the reason.

## Questions

1. **Compression trade-off.** On a fixed question set, how much faster is the 4-bit build (q4f16_1) than full precision (q0f16), and how many points of accuracy does it lose?
2. **Cross-device consistency.** For a fixed build, on what share of devices does the model reproduce the reference answers exactly, and where it does not, at which token does output first diverge?

## Fixed settings

- Model: SmolLM2-360M-Instruct, WebLLM builds q4f16_1, q4f32_1, q0f16, q0f32. Runtime version recorded per result.
- Decoding: greedy (temperature 0), fixed `max_tokens` per question category, no system prompt beyond the chat template.
- Question set: `eval/questions.v1.jsonl`, frozen before the reference run. Target 500+ items.
- Scoring: exact match after a per-category normaliser (lowercase, trim, strip punctuation; numbers parsed as numbers).

## Primary metrics and tests

| Question | Metric | Interval / test |
| --- | --- | --- |
| Accuracy per build | proportion correct | Wilson 95% CI |
| Accuracy lost by 4-bit | paired difference q0f16 − q4f16_1 on the same items | McNemar exact test; paired bootstrap 95% CI (10,000 resamples) |
| Where 4-bit hurts | per-category difference | same as above, Holm-corrected across categories |
| Speed gained by 4-bit | ratio of median decode tok/s, same device | bootstrap CI across devices measured by me |
| Device consistency | share of devices matching all reference answers, per build | Wilson 95% CI |
| Drift location | first divergent token index per (device, question) | descriptive only |

## Decisions made in advance

- **Calibration.** Before freezing, categories where q0f16 scores below 25% or above 95% on a pilot of ≤50 items are dropped or replaced. Pilot items are not reused in the frozen set.
- **Determinism baseline.** The full reference run is repeated twice on the same device. If outputs differ between the two runs, the consistency analysis reports same-device nondeterminism first and is not interpreted as hardware drift.
- **Builds are compared within compute type.** f16 devices are compared against f16 references, f32 against f32. The headline trade-off uses the f16 builds.
- **Exclusions.** Crowd results are excluded if: the instant-score CPU check failed, any timing is non-positive, decode speed exceeds 2,000 tok/s, or the runtime or question-set version does not match the reference.
- **Null results are reported.** If 4-bit costs no measurable accuracy (CI includes 0) or all devices agree, that is the finding.

## Deviations

_None yet._
