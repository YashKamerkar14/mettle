# Speed: 4-bit vs full precision

2 sessions on nvidia lovelace, WebLLM 0.2.86, ABBA order, power plan: Legion Balance Mode.

Excluded: session 3: laptop unplugged at 14:01:56 local (Windows Kernel-Power event 105), about 40 s into the session; blocks after that ran on battery; session 4: ran entirely on battery (unplugged during session 3); the runner then stopped before session 5 on its AC-power check.

| Session | 4-bit decode | Full decode | Decode ratio | Prefill ratio |
| --- | --- | --- | --- | --- |
| 1 | 123.7 tok/s | 109.9 tok/s | 1.13× | 1.18× |
| 2 | 123.1 tok/s | 112.8 tok/s | 1.09× | 1.16× |

**Generation: 4-bit is 1.11× as fast as full precision** (geometric mean, 95% CI 0.92–1.34).
Prompt reading (secondary): 1.17× (95% CI 1.05–1.30).
