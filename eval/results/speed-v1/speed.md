# Speed: 4-bit vs full precision

10 sessions on nvidia lovelace, WebLLM 0.2.86, ABBA order, power plan: Legion Balance Mode.

Excluded: session 3: laptop unplugged at 14:01:56 local (Windows Kernel-Power event 105), about 40 s into the session; blocks after that ran on battery; session 4: ran entirely on battery (unplugged during session 3); the runner then stopped before session 5 on its AC-power check; session 5: protocol violation: the author's tooling (type checks, Deno download and check, unit tests) ran on the laptop during this session's idle window; excluded by that condition, regardless of its numbers; session 6: protocol violation: the author's tooling (type checks, Deno download and check, unit tests) ran on the laptop during this session's idle window; excluded by that condition, regardless of its numbers.

| Session | 4-bit decode | Full decode | Decode ratio | Prefill ratio |
| --- | --- | --- | --- | --- |
| 1 | 123.7 tok/s | 109.9 tok/s | 1.13× | 1.18× |
| 2 | 123.1 tok/s | 112.8 tok/s | 1.09× | 1.16× |
| 7 | 125.8 tok/s | 111.9 tok/s | 1.12× | 1.20× |
| 8 | 129.9 tok/s | 112.0 tok/s | 1.16× | 1.14× |
| 9 | 127.2 tok/s | 113.6 tok/s | 1.12× | 1.25× |
| 10 | 129.7 tok/s | 115.0 tok/s | 1.13× | 1.20× |
| 11 | 127.8 tok/s | 112.8 tok/s | 1.13× | 1.23× |
| 12 | 128.3 tok/s | 115.3 tok/s | 1.11× | 1.23× |
| 13 | 129.7 tok/s | 116.5 tok/s | 1.11× | 1.20× |
| 14 | 129.2 tok/s | 115.0 tok/s | 1.12× | 1.24× |

**Generation: 4-bit is 1.12× as fast as full precision** (geometric mean, 95% CI 1.11–1.14).
Prompt reading (secondary): 1.20× (95% CI 1.18–1.23).
