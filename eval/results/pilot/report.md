# Reference run: pilot

- Questions: `questions/pilot.v1.jsonl` (48 items)
- Device: nvidia lovelace, Chrome 154 on Windows
- WebLLM 0.2.86, settings {"temperature": 0, "max_tokens": 16, "top_logprobs": 2}
- Started 2026-10-12T08:13:57.232Z

## Same-device determinism

| Build | Runs | Identical outputs across runs |
| --- | --- | --- |
| q0f16 | 2 | 48/48 |
| q4f16_1 | 2 | 48/48 |

## Accuracy (run 1)

Primary = answer extracted from the first line; strict = whole first line is exactly the answer.

| Build | Primary | 95% CI | Strict | 95% CI |
| --- | --- | --- | --- | --- |
| q0f16 | 62.5% | [48.4, 74.8] | 43.8% | [30.7, 57.7] |
| q4f16_1 | 62.5% | [48.4, 74.8] | 8.3% | [3.3, 19.6] |

### By category (primary)

| Category | n | q0f16 | q4f16_1 |
| --- | --- | --- | --- |
| antonym | 8 | 87.5% | 87.5% |
| arithmetic | 8 | 87.5% | 75.0% |
| capital | 8 | 62.5% | 87.5% |
| compare | 8 | 62.5% | 37.5% |
| sentiment | 8 | 75.0% | 87.5% |
| sequence | 8 | 0.0% | 0.0% |

## Compression: q0f16 vs q4f16_1

- Accuracy lost (primary): **+0.0 points**, 95% CI [-16.7, 16.7], McNemar p = 1 (8 right only in q0f16, 8 right only in q4f16_1)
- Accuracy lost (strict): +35.4 points, 95% CI [18.8, 52.1]
- Identical outputs: 25.0%; where they differ, median first divergent token = 0.0

| Category | Points lost | 95% CI | Holm p |
| --- | --- | --- | --- |
| antonym | +0.0 | [-37.5, 37.5] | 1 |
| arithmetic | +12.5 | [0.0, 37.5] | 1 |
| capital | -25.0 | [-62.5, 0.0] | 1 |
| compare | +25.0 | [-50.0, 75.0] | 1 |
| sentiment | -12.5 | [-50.0, 25.0] | 1 |
| sequence | +0.0 | [0.0, 0.0] | 1 |

## Calibration (q0f16, keep if 25.0% <= accuracy <= 95.0%)

| Category | Accuracy | Decision |
| --- | --- | --- |
| antonym | 87.5% | keep |
| arithmetic | 87.5% | keep |
| capital | 62.5% | keep |
| compare | 62.5% | keep |
| sentiment | 75.0% | keep |
| sequence | 0.0% | drop |

## Outputs (run 1)

| id | answer | q0f16 | q4f16_1 |
| --- | --- | --- | --- |
| p1-antonym-0024 | right | ✓ 'Correct.' | ✓ 'The opposite of "wrong" is "correct".' |
| p1-antonym-0025 | melt | ✗ 'Unfreeze.' | ✓ 'The opposite of "freeze" is "thaw".' |
| p1-antonym-0026 | take | ✓ '"Take"' | ✓ 'The opposite of "give" is "receive."' |
| p1-antonym-0027 | thin | ✓ '"thin"' | ✓ 'The opposite of "fat" is "thin".' |
| p1-antonym-0028 | modern | ✓ 'Modern.' | ✗ 'The opposite of "ancient" is "recent".' |
| p1-antonym-0029 | after | ✓ 'After.' | ✓ 'The opposite of "before" is "after".' |
| p1-antonym-0030 | sell | ✓ '"sell"' | ✓ 'The opposite of "buy" is "sell".' |
| p1-antonym-0031 | night | ✓ 'Night.' | ✓ 'Night.' |
| p1-arithmetic-0000 | 95 | ✓ '61 + 34 = 95' | ✓ '61 + 34 = 95' |
| p1-arithmetic-0001 | 42 | ✓ '13 + 29 = 42' | ✓ '13 + 29 = 42' |
| p1-arithmetic-0002 | 96 | ✓ '65 + 31 = 96' | ✓ '65 + 31 = 96' |
| p1-arithmetic-0003 | 23 | ✓ '61 - 38 = 23' | ✓ '61 - 38 = 23' |
| p1-arithmetic-0004 | 13 | ✓ '97 - 84 = 13' | ✓ '97 - 84 = 13' |
| p1-arithmetic-0005 | 79 | ✗ '33 + 46 = 89' | ✗ '33 + 46 = 80' |
| p1-arithmetic-0006 | 68 | ✓ '37 + 31 = 68' | ✓ '37 + 31 = 68' |
| p1-arithmetic-0007 | 45 | ✓ '63 - 18 = 45' | ✗ '63' |
| p1-capital-0016 | Sanaa | ✗ 'Sana' | ✓ 'The capital of Yemen is Sanaa.' |
| p1-capital-0017 | Beirut | ✓ 'Beirut' | ✓ 'The capital of Lebanon is Beirut.' |
| p1-capital-0018 | Kuala Lumpur | ✓ 'Kuala Lumpur' | ✓ 'The capital of Malaysia is Kuala Lumpur.' |
| p1-capital-0019 | Tunis | ✓ 'Tunis' | ✓ 'The capital of Tunisia is Tunis.' |
| p1-capital-0020 | Reykjavik | ✓ 'The capital of Iceland is Reykjavik.' | ✓ 'The capital of Iceland is Reykjavik' |
| p1-capital-0021 | Ottawa | ✗ 'Montreal' | ✗ 'Montreal' |
| p1-capital-0022 | Canberra | ✗ 'Sydney' | ✓ 'The capital of Australia is Canberra.' |
| p1-capital-0023 | Manila | ✓ 'The capital of the Philippines is Manila.' | ✓ 'The capital of the Philippines is Manila.' |
| p1-compare-0008 | 98 | ✓ '98' | ✗ '100' |
| p1-compare-0009 | 93 | ✓ '93' | ✗ '1000000000000000' |
| p1-compare-0010 | 14 | ✗ '82' | ✓ '14' |
| p1-compare-0011 | 11 | ✗ '87.' | ✓ '11' |
| p1-compare-0012 | 16 | ✗ '26' | ✓ '16' |
| p1-compare-0013 | 57 | ✓ '57.' | ✗ '1010000000000000' |
| p1-compare-0014 | 48 | ✓ '48.' | ✗ '177' |
| p1-compare-0015 | 71 | ✓ '71.' | ✗ '1000000000000000' |
| p1-sentiment-0032 | positive | ✓ 'positive' | ✓ 'The review is positive.' |
| p1-sentiment-0033 | positive | ✓ 'Positive' | ✓ 'The review is positive.' |
| p1-sentiment-0034 | positive | ✓ 'positive' | ✗ 'negative' |
| p1-sentiment-0035 | positive | ✓ 'positive' | ✓ 'The review is positive.' |
| p1-sentiment-0036 | negative | ✓ 'Negative' | ✓ 'The review is negative.' |
| p1-sentiment-0037 | negative | ✓ 'Negative' | ✓ 'The review is negative.' |
| p1-sentiment-0038 | negative | ✗ 'positive' | ✓ 'The review is negative.' |
| p1-sentiment-0039 | negative | ✗ 'positive' | ✓ 'The review is negative.' |
| p1-sequence-0040 | Wednesday | ✗ 'Monday' | ✗ 'Monday.' |
| p1-sequence-0041 | Thursday | ✗ 'Tuesday' | ✗ 'Monday.' |
| p1-sequence-0042 | March | ✗ 'January' | ✗ 'January' |
| p1-sequence-0043 | May | ✗ 'April' | ✗ 'April' |
| p1-sequence-0044 | U | ✗ 'S' | ✗ 'The answer is "R".' |
| p1-sequence-0045 | M | ✗ 'J' | ✗ 'The next letter in the sequence is L.' |
| p1-sequence-0046 | 30 | ✗ '28' | ✗ '18' |
| p1-sequence-0047 | 20 | ✗ '14' | ✗ '14' |
