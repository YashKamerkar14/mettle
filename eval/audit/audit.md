# Scorer validity audit

472 outputs judged blind (no build label, no scorer verdict).

| Build | Audited | Scorer said correct, judge said wrong | Scorer said wrong, judge said correct | Agreement |
| --- | --- | --- | --- | --- |
| q0f16 | 236 | 0/131 | 2/105 | 99.2% |
| q4f16_1 | 236 | 0/132 | 2/104 | 99.2% |

Primary difference q0f16 − q4f16_1 with adjudicated labels substituted on audited items: **-0.4 points**, 95% CI [-5.8, 4.8], McNemar p = 0.941 (scorer-based: -0.4).

Per category with adjudicated labels:

| Category | Points lost (adjudicated) |
| --- | --- |
| antonym | -6.0 |
| arithmetic | +19.0 |
| capital | -22.0 |
| compare | +17.0 |
| sentiment | -10.0 |

## Author spot-check

The author re-judged 40 random adjudications (seed 2) and agreed with 40 (100%).
