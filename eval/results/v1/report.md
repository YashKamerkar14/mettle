# Reference run: v1

- Questions: `questions/questions.v1.jsonl` (500 items)
- Device: nvidia lovelace, Chrome 154 on Windows
- WebLLM 0.2.86, settings {"temperature": 1, "top_p": 1e-05, "max_tokens": 16, "top_logprobs": 2}
- Started 2026-10-12T08:35:55.007Z
- All accuracy figures use run 1; other runs are used only for determinism.

## Same-device determinism

| Build | Runs | Items identical across all runs | Mismatch rate |
| --- | --- | --- | --- |
| q0f16 | 4 | 500/500 | 0.0% |
| q0f32 | 4 | 500/500 | 0.0% |
| q4f16_1 | 4 | 500/500 | 0.0% |
| q4f32_1 | 4 | 500/500 | 0.0% |

## Accuracy (run 1)

Answer correct = primary score; followed format = the whole first line is exactly the answer.

| Build | Answer correct | 95% CI | Followed format | 95% CI | Truncated at max_tokens |
| --- | --- | --- | --- | --- | --- |
| q0f16 | 70.0% | [65.8, 73.9] | 48.0% | [43.7, 52.4] | 0/500 |
| q0f32 | 69.2% | [65.0, 73.1] | 47.0% | [42.7, 51.4] | 0/500 |
| q4f16_1 | 70.4% | [66.3, 74.2] | 8.6% | [6.4, 11.4] | 25/500 |
| q4f32_1 | 71.2% | [67.1, 75.0] | 7.4% | [5.4, 10.0] | 21/500 |

### By category (answer correct)

| Category | n | Chance | q0f16 | q0f32 | q4f16_1 | q4f32_1 |
| --- | --- | --- | --- | --- | --- | --- |
| antonym | 100 | ~0% | 79.0% | 78.0% | 86.0% | 85.0% |
| arithmetic | 100 | ~0% | 90.0% | 90.0% | 71.0% | 78.0% |
| capital | 100 | ~0% | 64.0% | 64.0% | 85.0% | 86.0% |
| compare | 100 | 50.0% | 52.0% | 52.0% | 35.0% | 33.0% |
| sentiment | 100 | 50.0% | 65.0% | 62.0% | 75.0% | 74.0% |

## Primary endpoint: q0f16 vs q4f16_1

- **Answer correct:** q0f16 − q4f16_1 = **-0.4 points**, 95% CI [-5.8, 5.0], 90% CI [-5.0, 4.0], exact McNemar p = 0.942 (92 right only in q0f16, 94 right only in q4f16_1)
- **Reading (±5-point margin): inconclusive**
- **Followed format:** +39.4 points, 95% CI [34.4, 44.4]
- Identical outputs: 18.8%; where they differ, median first divergent token = 0.0
- q0f16's top-1 vs top-2 log-prob margin at the divergent token: median 0.57 (all tokens: median 2.88)

Per category (exploratory; CIs are not adjusted for multiplicity, p-values are Holm-adjusted):

| Category | Points lost | 95% CI | Holm p |
| --- | --- | --- | --- |
| antonym | -7.0 | [-14.0, 0.0] | 0.185 |
| arithmetic | +19.0 | [11.0, 28.0] | 0.00033 |
| capital | -21.0 | [-32.0, -10.0] | 0.00301 |
| compare | +17.0 | [3.0, 31.0] | 0.0901 |
| sentiment | -10.0 | [-25.0, 5.0] | 0.237 |

## Secondary: q0f32 vs q4f32_1

- **Answer correct:** q0f32 − q4f32_1 = **-2.0 points**, 95% CI [-7.2, 3.4], 90% CI [-6.4, 2.4], exact McNemar p = 0.512 (89 right only in q0f32, 99 right only in q4f32_1)
- **Reading (±5-point margin): inconclusive**
- **Followed format:** +39.6 points, 95% CI [34.8, 44.2]
- Identical outputs: 19.6%; where they differ, median first divergent token = 0.0
- q0f32's top-1 vs top-2 log-prob margin at the divergent token: median 0.59 (all tokens: median 2.90)

Per category (exploratory; CIs are not adjusted for multiplicity, p-values are Holm-adjusted):

| Category | Points lost | 95% CI | Holm p |
| --- | --- | --- | --- |
| antonym | -7.0 | [-14.0, 0.0] | 0.185 |
| arithmetic | +12.0 | [4.0, 20.0] | 0.0439 |
| capital | -22.0 | [-34.0, -10.0] | 0.0034 |
| compare | +19.0 | [5.0, 32.0] | 0.0439 |
| sentiment | -12.0 | [-27.0, 3.0] | 0.185 |

## Consistency subset

Wrote `subset.v1.jsonl`, SHA-256 `65aacbb304ab0e2579c0d7e1fcf760dd4a785264a86235a082a707260e847082`.

## Outputs (run 1)

| id | answer | q0f16 | q0f32 | q4f16_1 | q4f32_1 |
| --- | --- | --- | --- | --- | --- |
| q1-antonym-0300 | even | ✓ 'Even.' | ✓ 'Even.' | ✓ 'The opposite of "odd" is "even".' | ✓ 'The opposite of "odd" is "even".' |
| q1-antonym-0301 | sour | ✓ '"bitter"' | ✓ '"bitter"' | ✓ 'The opposite of "sweet" is "bitter."' | ✓ 'The opposite of "sweet" is "sour."' |
| q1-antonym-0302 | empty | ✓ 'empty' | ✓ 'empty' | ✓ 'The opposite of "full" is "empty".' | ✓ 'The opposite of "full" is "empty".' |
| q1-antonym-0303 | absence | ✓ 'Absence.' | ✓ 'Absence.' | ✓ 'The opposite of "presence" is "absence".' | ✓ 'The opposite of "presence" is "absence".' |
| q1-antonym-0304 | innocent | ✓ '"innocent"' | ✓ '"innocent"' | ✓ 'Incorrect. The opposite of "guilty" is "innocent".' | ✓ 'Incorrect. The opposite of "guilty" is "innocent".' |
| q1-antonym-0305 | subtract | ✓ '"subtract"' | ✓ '"subtract"' | ✓ 'The opposite of "add" is "remove".' | ✓ 'The opposite of "add" is "remove".' |
| q1-antonym-0306 | dishonest | ✗ 'Lying.' | ✗ 'Lying.' | ✓ 'The opposite of "honest" is "dishonest".' | ✓ 'The opposite of "honest" is "dishonest".' |
| q1-antonym-0307 | disagree | ✓ 'Disagree.' | ✓ 'Disagree.' | ✓ 'The opposite of "agree" is "disagree".' | ✓ 'The opposite of "agree" is "disagree".' |
| q1-antonym-0308 | dirty | ✓ '"dirty"' | ✓ '"dirty"' | ✓ 'The opposite of "clean" is "dirty."' | ✓ 'The opposite of "clean" is "dirty".' |
| q1-antonym-0309 | unknown | ✓ 'Unknown.' | ✓ 'Unknown.' | ✓ 'Unknown.' | ✓ 'Unknown' |
| q1-antonym-0310 | loose | ✓ '"Loose"' | ✓ '"Loose"' | ✓ 'The opposite of "tight" is "loose".' | ✓ 'The opposite of "tight" is "loose".' |
| q1-antonym-0311 | dangerous | ✓ 'Unsafe.' | ✓ 'Unsafe.' | ✓ 'The opposite of "safe" is "unsafe".' | ✓ 'The opposite of "safe" is "unsafe".' |
| q1-antonym-0312 | lose | ✓ '"lose"' | ✓ '"lose"' | ✓ 'The opposite of "win" is "lose."' | ✓ 'The opposite of "win" is "lose."' |
| q1-antonym-0313 | past | ✓ 'Past.' | ✓ 'Past.' | ✓ 'The opposite of the word "future" is "past".' | ✓ 'The opposite of the word "future" is "past".' |
| q1-antonym-0314 | asleep | ✓ 'Asleep.' | ✓ 'Asleep.' | ✓ 'The opposite of "awake" is "asleep."' | ✓ 'The opposite of "awake" is "asleep."' |
| q1-antonym-0315 | rough | ✓ '"rough"' | ✓ '"rough"' | ✓ 'The opposite of "smooth" is "rough".' | ✓ 'The opposite of "smooth" is "rough".' |
| q1-antonym-0316 | incorrect | ✓ 'Incorrect.' | ✓ 'Incorrect.' | ✓ 'The opposite of "correct" is "incorrect".' | ✓ 'The opposite of "correct" is "incorrect".' |
| q1-antonym-0317 | back | ✓ 'Back.' | ✓ 'Back.' | ✓ 'The opposite of "front" is "rear".' | ✓ 'The opposite of "front" is "rear".' |
| q1-antonym-0318 | depart | ✗ '"disappear"' | ✗ '"disappear"' | ✗ 'The opposite of "arrive" is "disappear".' | ✗ 'The opposite of "arrive" is "disappear".' |
| q1-antonym-0319 | low | ✓ 'Low.' | ✓ 'Low.' | ✓ 'The opposite of "high" is "low".' | ✓ 'The opposite of "high" is "low".' |
| q1-antonym-0320 | awake | ✗ 'Asleep' | ✗ 'Asleep' | ✓ 'The opposite of "asleep" is "awake".' | ✓ 'The opposite of "asleep" is "awake".' |
| q1-antonym-0321 | permanent | ✗ 'Immovable.' | ✗ 'Immutable.' | ✗ 'The opposite of "temporary" would be "permanent".' | ✗ 'The opposite of "temporary" would be "permanent".' |
| q1-antonym-0322 | right | ✓ 'Right.' | ✓ 'Right.' | ✓ 'The opposite of "left" is "right".' | ✓ 'The opposite of the word "left" is "right".' |
| q1-antonym-0323 | shallow | ✓ '"Shallow."' | ✓ '"Shallow."' | ✗ 'The opposite of "deep" is "simple".' | ✗ 'The opposite of "deep" is "simple".' |
| q1-antonym-0324 | reject | ✓ '"reject"' | ✓ '"reject"' | ✓ 'One opposite of the word "accept" is "reject".' | ✓ 'The opposite of "accept" is "reject".' |
| q1-antonym-0325 | narrow | ✗ '"Short"' | ✗ '"Short"' | ✓ 'The opposite of "wide" is "narrow".' | ✓ 'The opposite of "wide" is "narrow".' |
| q1-antonym-0326 | slow | ✓ 'Slow.' | ✓ 'Slow.' | ✓ 'The opposite of "fast" is "slow".' | ✓ 'The opposite of "fast" is "slow".' |
| q1-antonym-0327 | complex | ✓ 'Complex.' | ✓ 'Complex.' | ✓ 'The opposite of "simple" is "complex".' | ✓ 'The opposite of "simple" is "complex".' |
| q1-antonym-0328 | female | ✓ '"female"' | ✓ '"female"' | ✓ 'The opposite of "male" is "female".' | ✓ 'The opposite of "male" is "female".' |
| q1-antonym-0329 | minimum | ✗ 'Minus.' | ✗ 'Minus.' | ✓ 'One opposite of the word "maximum" is "minimum".' | ✓ 'The opposite of the word "maximum" is "minimum".' |
| q1-antonym-0330 | daughter | ✓ 'Daughter.' | ✓ 'Daughter.' | ✓ 'The opposite of "son" is "daughter".' | ✓ 'The opposite of "son" is "daughter".' |
| q1-antonym-0331 | defeat | ✓ '"Defeat"' | ✓ '"Defeat"' | ✓ 'Answer: defeat' | ✓ 'The opposite of "victory" is "defeat".' |
| q1-antonym-0332 | horizontal | ✓ 'Horizontal.' | ✓ 'Horizontal.' | ✓ 'Horizontal.' | ✓ 'Horizontal' |
| q1-antonym-0333 | singular | ✓ 'singular.' | ✗ 'Unplural.' | ✓ 'The opposite of "plural" is "singular."' | ✓ 'The opposite of the word "plural" is "singular".' |
| q1-antonym-0334 | lend | ✗ '"Give"' | ✗ '"Give"' | ✗ 'The opposite of "borrow" is "give".' | ✗ 'The opposite of "borrow" is "give".' |
| q1-antonym-0335 | exclude | ✓ '"exclude"' | ✓ '"exclude"' | ✓ 'One opposite of "include" is "exclude".' | ✓ 'One opposite of "include" is "exclude".' |
| q1-antonym-0336 | west | ✓ 'west' | ✓ 'west' | ✓ 'West' | ✓ 'West' |
| q1-antonym-0337 | dry | ✓ 'Dry.' | ✓ 'Dry.' | ✓ 'The opposite of "wet" is "dry".' | ✓ 'The opposite of "wet" is "dry".' |
| q1-antonym-0338 | ceiling | ✗ 'Up' | ✗ 'Up.' | ✓ 'The opposite of "floor" is "ceiling."' | ✓ 'The opposite of "floor" is "ceiling."' |
| q1-antonym-0339 | old | ✓ '"old"' | ✓ '"old"' | ✓ 'The opposite of "young" is "old".' | ✓ 'The opposite of "young" is "old".' |
| q1-antonym-0340 | cowardly | ✗ 'Fearless.' | ✗ 'Fearless.' | ✗ 'One opposite of "brave" is "bravado."' | ✗ 'The opposite of "brave" is "bravado."' |
| q1-antonym-0341 | closed | ✓ 'Close.' | ✓ 'Close.' | ✓ 'The opposite of "open" is "closed".' | ✓ 'The opposite of "open" is "closed".' |
| q1-antonym-0342 | defend | ✓ 'Defence.' | ✓ 'Defence.' | ✓ 'The opposite of "attack" is "defense."' | ✓ 'The opposite of "attack" is "defense".' |
| q1-antonym-0343 | last | ✗ 'Second.' | ✗ 'Second.' | ✓ 'The opposite of "first" is "last".' | ✓ 'The opposite of "first" is "last".' |
| q1-antonym-0344 | bad | ✓ 'Bad.' | ✓ 'Bad.' | ✓ 'The opposite of "good" is "bad".' | ✓ 'The opposite of "good" is "bad".' |
| q1-antonym-0345 | dull | ✗ '"flat"' | ✗ '"flat"' | ✓ 'The opposite of "sharp" is "dull".' | ✗ 'The opposite of "sharp" is "flat".' |
| q1-antonym-0346 | junior | ✓ 'Junior.' | ✓ 'Junior.' | ✓ 'The opposite of "senior" is "junior".' | ✓ 'The opposite of the word "senior" is "junior".' |
| q1-antonym-0347 | export | ✓ '"export"' | ✓ '"export"' | ✓ 'The opposite of "import" is "export".' | ✓ 'The opposite of "import" is "export".' |
| q1-antonym-0348 | forbid | ✓ '"Deny"' | ✓ '"Deny"' | ✓ 'One opposite of "allow" is "disallow".' | ✓ 'The opposite of "allow" is "disallow".' |
| q1-antonym-0349 | smile | ✓ '"Smile"' | ✓ '"Smile"' | ✓ 'The opposite of "frown" is "smile".' | ✓ 'The opposite of "frown" is "smile".' |
| q1-antonym-0350 | tame | ✓ '"Tame."' | ✓ '"Tame."' | ✓ 'The opposite of "wild" is "tame".' | ✓ 'The opposite of "wild" is "tame".' |
| q1-antonym-0351 | small | ✓ 'Small.' | ✓ 'Small.' | ✓ 'The opposite of "big" is "little".' | ✓ 'The opposite of "big" is "little".' |
| q1-antonym-0352 | never | ✗ 'Unpredictable.' | ✗ 'Unpredictable.' | ✓ 'The opposite of "always" is "never".' | ✓ 'The opposite of "always" is "never".' |
| q1-antonym-0353 | exit | ✓ 'exit' | ✓ 'exit' | ✓ 'Exit' | ✗ 'Output:' |
| q1-antonym-0354 | expensive | ✓ '"Expensive"' | ✓ '"Expensive"' | ✓ 'The opposite of "cheap" is "expensive".' | ✓ 'The opposite of "cheap" is "expensive".' |
| q1-antonym-0355 | impatient | ✗ 'Unpatient.' | ✗ 'Unpatient.' | ✗ 'The opposite of the word "patient" is "aggressive"' | ✗ 'The opposite of the word "patient" is "troubled".' |
| q1-antonym-0356 | short | ✓ 'Short.' | ✓ 'Short.' | ✓ 'The opposite of "tall" is "short".' | ✓ 'The opposite of "tall" is "short".' |
| q1-antonym-0357 | sad | ✓ 'Sad.' | ✓ 'Sad.' | ✓ 'Sad' | ✓ 'Sad' |
| q1-antonym-0358 | sink | ✗ '"Fixed"' | ✗ '"Fixed"' | ✗ 'The opposite of "float" is "settle".' | ✗ 'The opposite of "float" is "settle".' |
| q1-antonym-0359 | aunt | ✗ 'Uncle.' | ✗ 'Uncle.' | ✗ 'The opposite of "uncle" is "niece".' | ✗ 'The opposite of "uncle" is "niece".' |
| q1-antonym-0360 | down | ✓ 'Down.' | ✓ 'Down.' | ✓ 'The opposite of "up" is "down".' | ✓ 'The opposite of "up" is "down".' |
| q1-antonym-0361 | wife | ✓ '"Wife."' | ✓ '"Wife."' | ✓ 'The opposite of "husband" is "wife".' | ✓ 'The opposite of "husband" is "wife".' |
| q1-antonym-0362 | sister | ✓ 'Sister.' | ✓ 'Sister.' | ✓ 'The opposite of "brother" is "sister".' | ✓ 'The opposite of "brother" is "sister".' |
| q1-antonym-0363 | maximum | ✓ 'Maximum.' | ✓ 'Maximum.' | ✓ 'The opposite of "minimum" is "maximum".' | ✓ 'The opposite of the word "minimum" is "maximum".' |
| q1-antonym-0364 | south | ✓ 'south' | ✓ 'south' | ✓ 'South' | ✓ 'South' |
| q1-antonym-0365 | bottom | ✓ 'Bottom.' | ✓ 'Bottom.' | ✓ 'The opposite of "top" is "bottom".' | ✓ 'The opposite of "top" is "bottom".' |
| q1-antonym-0366 | failure | ✓ 'Failure' | ✓ 'Failure' | ✗ 'Successor.' | ✓ 'The opposite of "success" is failure.' |
| q1-antonym-0367 | thin | ✓ '"thin"' | ✓ '"thin"' | ✓ 'The opposite of "thick" is "thin".' | ✓ 'The opposite of "thick" is "thin".' |
| q1-antonym-0368 | light | ✓ 'Light.' | ✓ 'Light.' | ✓ 'The opposite of "heavy" is "light."' | ✓ 'The opposite of "heavy" is "light."' |
| q1-antonym-0369 | cry | ✗ '"Sigh"' | ✗ '"Sigh"' | ✗ 'The opposite of "laugh" is "sigh."' | ✗ 'The opposite of "laugh" is "sigh".' |
| q1-antonym-0370 | light | ✓ 'Light.' | ✓ 'Light.' | ✓ 'The opposite of "dark" is "light".' | ✓ 'The opposite of "dark" is "light".' |
| q1-antonym-0371 | disappear | ✗ 'Inverse.' | ✗ 'Inverse.' | ✗ 'The opposite of "appear" is "hide".' | ✗ 'The opposite of "appear" is "hide".' |
| q1-antonym-0372 | soft | ✓ 'Soft.' | ✓ 'Soft.' | ✓ 'The opposite of "hard" is "soft".' | ✓ 'The opposite of "hard" is "soft".' |
| q1-antonym-0373 | fall | ✓ '"Fall"' | ✓ '"Fall"' | ✗ 'The opposite of "rise" is "low".' | ✗ 'The opposite of "rise" is "low".' |
| q1-antonym-0374 | girl | ✓ 'girl' | ✓ 'girl' | ✓ 'The opposite of "boy" is "girl".' | ✓ 'The opposite of "boy" is "girl".' |
| q1-antonym-0375 | cold | ✓ 'Cold.' | ✓ 'Cold.' | ✓ 'The opposite of "hot" is "cold."' | ✓ 'The opposite of "hot" is "cold".' |
| q1-antonym-0376 | decrease | ✓ 'Decrease.' | ✓ 'Decrease.' | ✓ 'One opposite of "increase" is "decrease".' | ✓ 'One opposite of "increase" is "decrease".' |
| q1-antonym-0377 | quiet | ✓ 'Silent.' | ✓ 'Silent.' | ✓ 'The opposite of "noisy" is "quiet".' | ✓ 'The opposite of "noisy" is "quiet".' |
| q1-antonym-0378 | below | ✓ 'Below.' | ✓ 'Below.' | ✓ 'The opposite of "above" is "below".' | ✓ 'The opposite of "above" is "below".' |
| q1-antonym-0379 | near | ✓ 'Near.' | ✓ 'Near.' | ✓ 'The opposite of "far" is "near".' | ✓ 'The opposite of "far" is "near".' |
| q1-antonym-0380 | poor | ✓ 'Poor.' | ✓ 'Poor.' | ✓ 'The opposite of "rich" is "poor".' | ✓ 'The opposite of "rich" is "poor".' |
| q1-antonym-0381 | winter | ✓ 'Winter.' | ✓ 'Winter.' | ✓ 'The opposite of "summer" is "winter".' | ✓ 'The opposite of the word "summer" is "winter".' |
| q1-antonym-0382 | illegal | ✗ 'Unlegal.' | ✗ 'Unlegal.' | ✓ 'The opposite of "legal" is "illegal".' | ✓ 'The opposite of "legal" is "illegal".' |
| q1-antonym-0383 | pull | ✓ '"Pull".' | ✓ '"Pull".' | ✓ 'The opposite of "push" is "pull".' | ✓ 'The opposite of "push" is "pull".' |
| q1-antonym-0384 | enemy | ✓ 'Enemy.' | ✓ '"Enemy"' | ✓ 'The opposite of "friend" is "enemy."' | ✓ 'The opposite of "friend" is "enemy."' |
| q1-antonym-0385 | negative | ✓ 'Negative.' | ✓ 'Negative.' | ✓ 'The opposite of "positive" is "negative".' | ✓ 'The opposite of "positive" is "negative".' |
| q1-antonym-0386 | weak | ✓ 'weak.' | ✓ 'weak.' | ✓ 'The opposite of "strong" is "weak".' | ✓ 'The opposite of "strong" is "weak".' |
| q1-antonym-0387 | public | ✓ 'Public.' | ✓ 'Public.' | ✓ 'The opposite of "private" is "public".' | ✓ 'The opposite of the word "private" is "public".' |
| q1-antonym-0388 | shout | ✗ '"Breathe."' | ✗ '"Breathe."' | ✗ 'The opposite of "whisper" is "clear".' | ✗ 'The opposite of "whisper" is "clear".' |
| q1-antonym-0389 | end | ✓ 'end' | ✓ 'end' | ✓ 'The opposite of "begin" is "end".' | ✓ 'The opposite of "begin" is "end".' |
| q1-antonym-0390 | outside | ✓ 'Outside.' | ✓ 'Outside.' | ✓ 'The opposite of "inside" is "outside".' | ✓ 'The opposite of "inside" is "outside".' |
| q1-antonym-0391 | minor | ✓ 'Minor.' | ✓ 'Minor.' | ✓ 'The opposite of "major" is "minor".' | ✓ 'The opposite of "major" is "minor".' |
| q1-antonym-0392 | queen | ✓ '"queen"' | ✓ '"queen"' | ✓ 'The opposite of "king" is "queen".' | ✓ 'The opposite of "king" is "queen".' |
| q1-antonym-0393 | late | ✓ 'Late.' | ✓ 'Late.' | ✓ 'Late.' | ✓ 'Late.' |
| q1-antonym-0394 | stingy | ✗ '"Ungenerous"' | ✗ '"Ungenerous"' | ✗ 'One opposite of "generous" is "frugal".' | ✗ 'One opposite of "generous" is "frugal".' |
| q1-antonym-0395 | forget | ✓ 'forget.' | ✓ 'forget.' | ✓ 'The opposite of "remember" is "forget".' | ✓ 'The opposite of "remember" is "forget".' |
| q1-antonym-0396 | impossible | ✗ 'Unpossible.' | ✗ 'Unpossible.' | ✓ 'The opposite of "possible" is "impossible".' | ✓ 'The opposite of "possible" is "impossible".' |
| q1-antonym-0397 | found | ✓ '"Found"' | ✓ '"Found"' | ✓ 'The opposite of "lost" is "found".' | ✓ 'The opposite of "lost" is "found".' |
| q1-antonym-0398 | hate | ✓ 'Hate.' | ✓ 'Hate.' | ✓ 'The opposite of "love" is "hate".' | ✓ 'The opposite of "love" is "hate".' |
| q1-antonym-0399 | quiet | ✓ 'Silent.' | ✓ 'Silent.' | ✓ 'The opposite of "loud" is "quiet".' | ✓ 'The opposite of "loud" is "quiet".' |
| q1-arithmetic-0000 | 25 | ✓ '10 + 15 = 25' | ✓ '10 + 15 = 25' | ✓ '10 + 15 = 25' | ✓ '10 + 15 = 25' |
| q1-arithmetic-0001 | 15 | ✓ '61 - 46 = 15' | ✓ '61 - 46 = 15' | ✓ '61 - 46 = 15' | ✓ '61 - 46 = 15' |
| q1-arithmetic-0002 | 89 | ✓ '65 + 24 = 89' | ✓ '65 + 24 = 89' | ✓ '65 + 24 = 89' | ✓ '65 + 24 = 89' |
| q1-arithmetic-0003 | 4 | ✓ '96 - 92 = 4' | ✓ '96 - 92 = 4' | ✓ '96 - 92 = 4' | ✓ '96 - 92 = 4' |
| q1-arithmetic-0004 | 55 | ✓ '71 - 16 = 55' | ✓ '71 - 16 = 55' | ✗ '71' | ✓ '71 - 16 = 55' |
| q1-arithmetic-0005 | 3 | ✓ '86 - 83 = 3' | ✓ '86 - 83 = 3' | ✓ '86 - 83 = 3' | ✓ '86 - 83 = 3' |
| q1-arithmetic-0006 | 35 | ✓ '85 - 50 = 35' | ✓ '85 - 50 = 35' | ✓ '85 - 50 = 35' | ✓ '85 - 50 = 35' |
| q1-arithmetic-0007 | 57 | ✓ '10 + 47 = 57' | ✓ '10 + 47 = 57' | ✓ '10 + 47 = 57' | ✓ '10 + 47 = 57' |
| q1-arithmetic-0008 | 25 | ✓ '48 - 23 = 25' | ✓ '48 - 23 = 25' | ✓ '48 - 23 = 25' | ✓ '48 - 23 = 25' |
| q1-arithmetic-0009 | 139 | ✓ '60 + 79 = 139' | ✓ '60 + 79 = 139' | ✓ '60 + 79 = 139' | ✓ '60 + 79 = 139' |
| q1-arithmetic-0010 | 3 | ✓ '98 - 95 = 3' | ✓ '98 - 95 = 3' | ✓ '98 - 95 = 3' | ✓ '98 - 95 = 3' |
| q1-arithmetic-0011 | 25 | ✓ '41 - 16 = 25' | ✓ '41 - 16 = 25' | ✗ '16' | ✗ '41' |
| q1-arithmetic-0012 | 6 | ✓ '35 - 29 = 6' | ✓ '35 - 29 = 6' | ✓ '35 - 29 = 6' | ✓ '35 - 29 = 6' |
| q1-arithmetic-0013 | 19 | ✓ '45 - 26 = 19' | ✓ '45 - 26 = 19' | ✓ '45 - 26 = 19' | ✓ '45 - 26 = 19' |
| q1-arithmetic-0014 | 4 | ✓ '83 - 79 = 4' | ✓ '83 - 79 = 4' | ✗ '83' | ✗ '83' |
| q1-arithmetic-0015 | 41 | ✓ '24 + 17 = 41' | ✓ '24 + 17 = 41' | ✓ '24 + 17 = 41' | ✓ '24 + 17 = 41' |
| q1-arithmetic-0016 | 57 | ✓ '98 - 41 = 57' | ✓ '98 - 41 = 57' | ✓ '98 - 41 = 57' | ✓ '98 - 41 = 57' |
| q1-arithmetic-0017 | 106 | ✓ '62 + 44 = 106' | ✓ '62 + 44 = 106' | ✓ '62 + 44 = 106' | ✓ '62 + 44 = 106' |
| q1-arithmetic-0018 | 33 | ✓ '53 - 20 = 33' | ✓ '53 - 20 = 33' | ✗ '53' | ✗ '53' |
| q1-arithmetic-0019 | 122 | ✓ '26 + 96 = 122' | ✓ '26 + 96 = 122' | ✓ '26 + 96 = 122' | ✓ '26 + 96 = 122' |
| q1-arithmetic-0020 | 20 | ✓ '53 - 33 = 20' | ✓ '53 - 33 = 20' | ✓ '53 - 33 = 20' | ✓ '53 - 33 = 20' |
| q1-arithmetic-0021 | 57 | ✓ '41 + 16 = 57' | ✓ '41 + 16 = 57' | ✓ '41 + 16 = 57' | ✓ '41 + 16 = 57' |
| q1-arithmetic-0022 | 79 | ✓ '22 + 57 = 79' | ✓ '22 + 57 = 79' | ✗ '22 + 57 = 89' | ✗ '22 + 57 = 89' |
| q1-arithmetic-0023 | 134 | ✓ '68 + 66 = 134' | ✓ '68 + 66 = 134' | ✗ '68 + 66 = 130' | ✗ '68 + 66 = 130' |
| q1-arithmetic-0024 | 11 | ✓ '78 - 67 = 11' | ✓ '78 - 67 = 11' | ✓ '78 - 67 = 11' | ✓ '78 - 67 = 11' |
| q1-arithmetic-0025 | 56 | ✓ '75 - 19 = 56' | ✓ '75 - 19 = 56' | ✓ '75 - 19 = 56' | ✓ '75 - 19 = 56' |
| q1-arithmetic-0026 | 11 | ✓ '93 - 82 = 11' | ✓ '93 - 82 = 11' | ✗ '93' | ✓ '93 - 82 = 11' |
| q1-arithmetic-0027 | 79 | ✗ '56 + 23 = 89' | ✗ '56 + 23 = 89' | ✗ '56 + 23 = 80' | ✗ '56 + 23 = 80' |
| q1-arithmetic-0028 | 9 | ✓ '75 - 66 = 9' | ✓ '75 - 66 = 9' | ✗ '75 - 66 = 11' | ✗ '75 - 66 = 11' |
| q1-arithmetic-0029 | 37 | ✓ '90 - 53 = 37' | ✓ '90 - 53 = 37' | ✓ '90 - 53 = 37' | ✓ '90 - 53 = 37' |
| q1-arithmetic-0030 | 51 | ✓ '85 - 34 = 51' | ✓ '85 - 34 = 51' | ✓ '85 - 34 = 51' | ✓ '85 - 34 = 51' |
| q1-arithmetic-0031 | 61 | ✓ '88 - 27 = 61' | ✓ '88 - 27 = 61' | ✓ '88 - 27 = 61' | ✓ '88 - 27 = 61' |
| q1-arithmetic-0032 | 129 | ✓ '92 + 37 = 129' | ✓ '92 + 37 = 129' | ✓ '92 + 37 = 129' | ✓ '92 + 37 = 129' |
| q1-arithmetic-0033 | 34 | ✓ '82 - 48 = 34' | ✓ '82 - 48 = 34' | ✓ '82 - 48 = 34' | ✓ '82 - 48 = 34' |
| q1-arithmetic-0034 | 89 | ✓ '33 + 56 = 89' | ✓ '33 + 56 = 89' | ✓ '33 + 56 = 89' | ✓ '33 + 56 = 89' |
| q1-arithmetic-0035 | 51 | ✓ '64 - 13 = 51' | ✓ '64 - 13 = 51' | ✗ '64' | ✓ '64 - 13 = 51' |
| q1-arithmetic-0036 | 127 | ✓ '35 + 92 = 127' | ✓ '35 + 92 = 127' | ✓ '35 + 92 = 127' | ✓ '35 + 92 = 127' |
| q1-arithmetic-0037 | 2 | ✗ '70' | ✗ '70' | ✗ '70' | ✓ '70 - 68 = 2' |
| q1-arithmetic-0038 | 8 | ✓ '68 - 60 = 8' | ✓ '68 - 60 = 8' | ✗ '60' | ✗ '60' |
| q1-arithmetic-0039 | 77 | ✓ '87 - 10 = 77' | ✓ '87 - 10 = 77' | ✓ '87 - 10 = 77' | ✓ '87 - 10 = 77' |
| q1-arithmetic-0040 | 63 | ✓ '44 + 19 = 63' | ✓ '44 + 19 = 63' | ✓ '44 + 19 = 63' | ✓ '44 + 19 = 63' |
| q1-arithmetic-0041 | 5 | ✓ '15 - 10 = 5' | ✓ '15 - 10 = 5' | ✗ '15' | ✗ '15 - 10 = 15' |
| q1-arithmetic-0042 | 157 | ✓ '87 + 70 = 157' | ✓ '87 + 70 = 157' | ✓ '87 + 70 = 157' | ✓ '87 + 70 = 157' |
| q1-arithmetic-0043 | 62 | ✓ '77 - 15 = 62' | ✓ '77 - 15 = 62' | ✓ '77 - 15 = 62' | ✓ '77 - 15 = 62' |
| q1-arithmetic-0044 | 85 | ✓ '23 + 62 = 85' | ✓ '23 + 62 = 85' | ✓ '23 + 62 = 85' | ✓ '23 + 62 = 85' |
| q1-arithmetic-0045 | 24 | ✓ '77 - 53 = 24' | ✓ '77 - 53 = 24' | ✓ '77 - 53 = 24' | ✓ '77 - 53 = 24' |
| q1-arithmetic-0046 | 2 | ✓ '21 - 19 = 2' | ✓ '21 - 19 = 2' | ✗ '21 - 19 = 10' | ✗ '21 - 19 = 10' |
| q1-arithmetic-0047 | 21 | ✓ '51 - 30 = 21' | ✓ '51 - 30 = 21' | ✓ '51 - 30 = 21' | ✓ '51 - 30 = 21' |
| q1-arithmetic-0048 | 84 | ✓ '66 + 18 = 84' | ✓ '66 + 18 = 84' | ✓ '66 + 18 = 84' | ✓ '66 + 18 = 84' |
| q1-arithmetic-0049 | 39 | ✗ '51 - 12 = 49' | ✗ '51 - 12 = 49' | ✗ '51' | ✗ '51 - 12 = 49' |
| q1-arithmetic-0050 | 8 | ✓ '82 - 74 = 8' | ✓ '82 - 74 = 8' | ✗ '82 - 74 = 10' | ✗ '82 - 74 = 10' |
| q1-arithmetic-0051 | 3 | ✗ '32' | ✗ '32' | ✗ '32' | ✗ '32 - 29 = 13' |
| q1-arithmetic-0052 | 65 | ✓ '13 + 52 = 65' | ✓ '13 + 52 = 65' | ✓ '13 + 52 = 65' | ✓ '13 + 52 = 65' |
| q1-arithmetic-0053 | 157 | ✓ '89 + 68 = 157' | ✓ '89 + 68 = 157' | ✓ '89 + 68 = 157' | ✓ '89 + 68 = 157' |
| q1-arithmetic-0054 | 23 | ✓ '52 - 29 = 23' | ✓ '52 - 29 = 23' | ✗ '52' | ✓ '52 - 29 = 23' |
| q1-arithmetic-0055 | 2 | ✓ '27 - 25 = 2' | ✓ '27 - 25 = 2' | ✓ '27 - 25 = 2' | ✓ '27 - 25 = 2' |
| q1-arithmetic-0056 | 32 | ✓ '14 + 18 = 32' | ✓ '14 + 18 = 32' | ✓ '14 + 18 = 32' | ✓ '14 + 18 = 32' |
| q1-arithmetic-0057 | 1 | ✓ '68 - 67 = 1' | ✓ '68 - 67 = 1' | ✓ '68 - 67 = 1' | ✓ '68 - 67 = 1' |
| q1-arithmetic-0058 | 36 | ✓ '92 - 56 = 36' | ✓ '92 - 56 = 36' | ✗ '92' | ✗ '92' |
| q1-arithmetic-0059 | 30 | ✓ '75 - 45 = 30' | ✓ '75 - 45 = 30' | ✓ '75 - 45 = 30' | ✓ '75 - 45 = 30' |
| q1-arithmetic-0060 | 11 | ✓ '72 - 61 = 11' | ✓ '72 - 61 = 11' | ✗ '72' | ✓ '72 - 61 = 11' |
| q1-arithmetic-0061 | 142 | ✓ '57 + 85 = 142' | ✓ '57 + 85 = 142' | ✓ '57 + 85 = 142' | ✓ '57 + 85 = 142' |
| q1-arithmetic-0062 | 23 | ✓ '55 - 32 = 23' | ✓ '55 - 32 = 23' | ✓ '55 - 32 = 23' | ✓ '55 - 32 = 23' |
| q1-arithmetic-0063 | 51 | ✓ '62 - 11 = 51' | ✓ '62 - 11 = 51' | ✓ '62 - 11 = 51' | ✓ '62 - 11 = 51' |
| q1-arithmetic-0064 | 162 | ✓ '76 + 86 = 162' | ✓ '76 + 86 = 162' | ✓ '76 + 86 = 162' | ✓ '76 + 86 = 162' |
| q1-arithmetic-0065 | 56 | ✓ '38 + 18 = 56' | ✓ '38 + 18 = 56' | ✓ '38 + 18 = 56' | ✓ '38 + 18 = 56' |
| q1-arithmetic-0066 | 35 | ✓ '59 - 24 = 35' | ✓ '59 - 24 = 35' | ✓ '59 - 24 = 35' | ✓ '59 - 24 = 35' |
| q1-arithmetic-0067 | 55 | ✓ '12 + 43 = 55' | ✓ '12 + 43 = 55' | ✓ '12 + 43 = 55' | ✓ '12 + 43 = 55' |
| q1-arithmetic-0068 | 21 | ✓ '38 - 17 = 21' | ✓ '38 - 17 = 21' | ✓ '38 - 17 = 21' | ✓ '38 - 17 = 21' |
| q1-arithmetic-0069 | 10 | ✓ '87 - 77 = 10' | ✓ '87 - 77 = 10' | ✓ '87 - 77 = 10' | ✓ '87 - 77 = 10' |
| q1-arithmetic-0070 | 112 | ✓ '38 + 74 = 112' | ✓ '38 + 74 = 112' | ✓ '38 + 74 = 112' | ✓ '38 + 74 = 112' |
| q1-arithmetic-0071 | 94 | ✓ '50 + 44 = 94' | ✓ '50 + 44 = 94' | ✓ '50 + 44 = 94' | ✓ '50 + 44 = 94' |
| q1-arithmetic-0072 | 39 | ✗ '66 - 27 = 40' | ✗ '66 - 27 = 40' | ✗ '66 - 27 = 41' | ✗ '66 - 27 = 41' |
| q1-arithmetic-0073 | 24 | ✓ '71 - 47 = 24' | ✓ '71 - 47 = 24' | ✓ '71 - 47 = 24' | ✓ '71 - 47 = 24' |
| q1-arithmetic-0074 | 145 | ✓ '90 + 55 = 145' | ✓ '90 + 55 = 145' | ✓ '90 + 55 = 145' | ✓ '90 + 55 = 145' |
| q1-arithmetic-0075 | 105 | ✓ '80 + 25 = 105' | ✓ '80 + 25 = 105' | ✓ '80 + 25 = 105' | ✓ '80 + 25 = 105' |
| q1-arithmetic-0076 | 64 | ✓ '91 - 27 = 64' | ✓ '91 - 27 = 64' | ✓ '91 - 27 = 64' | ✓ '91 - 27 = 64' |
| q1-arithmetic-0077 | 12 | ✗ '73 - 61 = 7' | ✗ '73 - 61 = 7' | ✗ '73' | ✗ '73' |
| q1-arithmetic-0078 | 95 | ✓ '30 + 65 = 95' | ✓ '30 + 65 = 95' | ✓ '30 + 65 = 95' | ✓ '30 + 65 = 95' |
| q1-arithmetic-0079 | 10 | ✓ '34 - 24 = 10' | ✓ '34 - 24 = 10' | ✗ '34' | ✓ '34 - 24 = 10' |
| q1-arithmetic-0080 | 38 | ✓ '23 + 15 = 38' | ✓ '23 + 15 = 38' | ✓ '23 + 15 = 38' | ✓ '23 + 15 = 38' |
| q1-arithmetic-0081 | 19 | ✓ '47 - 28 = 19' | ✓ '47 - 28 = 19' | ✓ '47 - 28 = 19' | ✗ '47 - 28 = 29' |
| q1-arithmetic-0082 | 6 | ✗ '73' | ✗ '73' | ✗ '73' | ✗ '73' |
| q1-arithmetic-0083 | 106 | ✓ '64 + 42 = 106' | ✓ '64 + 42 = 106' | ✓ '64 + 42 = 106' | ✓ '64 + 42 = 106' |
| q1-arithmetic-0084 | 21 | ✓ '62 - 41 = 21' | ✓ '62 - 41 = 21' | ✗ '62 - 41 = 20' | ✗ '62 - 41 = 20' |
| q1-arithmetic-0085 | 19 | ✓ '99 - 80 = 19' | ✓ '99 - 80 = 19' | ✓ '99 - 80 = 19' | ✓ '99 - 80 = 19' |
| q1-arithmetic-0086 | 48 | ✓ '97 - 49 = 48' | ✓ '97 - 49 = 48' | ✓ '97 - 49 = 48' | ✓ '97 - 49 = 48' |
| q1-arithmetic-0087 | 47 | ✓ '74 - 27 = 47' | ✓ '74 - 27 = 47' | ✗ '74 - 27 = 55' | ✗ '74 - 27 = 45' |
| q1-arithmetic-0088 | 85 | ✓ '21 + 64 = 85' | ✓ '21 + 64 = 85' | ✓ '21 + 64 = 85' | ✓ '21 + 64 = 85' |
| q1-arithmetic-0089 | 10 | ✗ '54' | ✗ '54' | ✗ '54' | ✓ '54 - 44 = 10' |
| q1-arithmetic-0090 | 8 | ✓ '58 - 50 = 8' | ✓ '58 - 50 = 8' | ✗ '50' | ✗ '50' |
| q1-arithmetic-0091 | 114 | ✓ '71 + 43 = 114' | ✓ '71 + 43 = 114' | ✓ '71 + 43 = 114' | ✓ '71 + 43 = 114' |
| q1-arithmetic-0092 | 128 | ✗ '85 + 43 = 132' | ✗ '85 + 43 = 132' | ✓ '85 + 43 = 128' | ✓ '85 + 43 = 128' |
| q1-arithmetic-0093 | 36 | ✓ '78 - 42 = 36' | ✓ '78 - 42 = 36' | ✗ '78 - 42 = 30' | ✗ '78 - 42 = 30' |
| q1-arithmetic-0094 | 32 | ✓ '10 + 22 = 32' | ✓ '10 + 22 = 32' | ✓ '10 + 22 = 32' | ✓ '10 + 22 = 32' |
| q1-arithmetic-0095 | 24 | ✓ '78 - 54 = 24' | ✓ '78 - 54 = 24' | ✓ '78 - 54 = 24' | ✓ '78 - 54 = 24' |
| q1-arithmetic-0096 | 68 | ✓ '87 - 19 = 68' | ✓ '87 - 19 = 68' | ✓ '87 - 19 = 68' | ✓ '87 - 19 = 68' |
| q1-arithmetic-0097 | 16 | ✗ '52' | ✗ '52' | ✓ '52 - 36 = 16' | ✓ '52 - 36 = 16' |
| q1-arithmetic-0098 | 19 | ✓ '39 - 20 = 19' | ✓ '39 - 20 = 19' | ✓ '39 - 20 = 19' | ✓ '39 - 20 = 19' |
| q1-arithmetic-0099 | 26 | ✓ '80 - 54 = 26' | ✓ '80 - 54 = 26' | ✓ '80 - 54 = 26' | ✓ '80 - 54 = 26' |
| q1-capital-0200 | London | ✓ 'London' | ✓ 'London' | ✓ 'London' | ✓ 'London' |
| q1-capital-0201 | Dublin | ✗ 'Limerick' | ✗ 'Limerick' | ✓ 'The capital of Ireland is Dublin.' | ✓ 'The capital of Ireland is Dublin.' |
| q1-capital-0202 | Yerevan | ✓ "Armenia's capital is Yerevan." | ✓ "Armenia's capital is Yerevan." | ✗ 'Anatoliy is the capital of Armenia.' | ✗ 'Anatoliy is the capital of Armenia.' |
| q1-capital-0203 | Budapest | ✓ 'Budapest' | ✓ 'Budapest' | ✓ 'The capital of Hungary is Budapest.' | ✓ 'The capital of Hungary is Budapest.' |
| q1-capital-0204 | Kigali | ✓ 'Kigali' | ✓ 'Kigali' | ✓ 'The capital of Rwanda is Kigali.' | ✓ 'The capital of Rwanda is Kigali.' |
| q1-capital-0205 | Astana | ✗ 'Kazakhstan' | ✗ 'Kazakhstan' | ✓ 'The capital of Kazakhstan is Astana.' | ✓ 'The capital of Kazakhstan is Astana.' |
| q1-capital-0206 | Zagreb | ✓ 'Zagreb' | ✓ 'Zagreb' | ✓ 'The capital of Croatia is Zagreb.' | ✓ 'The capital of Croatia is Zagreb.' |
| q1-capital-0207 | Sofia | ✗ 'Bucharest' | ✗ 'Bucharest' | ✓ 'The capital of Bulgaria is Sofia' | ✓ 'The capital of Bulgaria is Sofia.' |
| q1-capital-0208 | Tokyo | ✓ 'Tokyo' | ✓ 'Tokyo' | ✓ 'The capital of Japan is Tokyo.' | ✓ 'The capital of Japan is Tokyo.' |
| q1-capital-0209 | Bucharest | ✓ 'Bucharest' | ✓ 'Bucharest' | ✓ 'The capital of Romania is Bucharest.' | ✓ 'The capital of Romania is Bucharest.' |
| q1-capital-0210 | Tashkent | ✗ 'Bashkortost.' | ✗ 'Bashkortost.' | ✓ 'The capital of Uzbekistan is Tashkent' | ✓ 'The capital of Uzbekistan is Tashkent' |
| q1-capital-0211 | Buenos Aires | ✓ 'Buenos Aires' | ✓ 'Buenos Aires' | ✓ 'The capital of Argentina is Buenos Aires.' | ✓ 'The capital of Argentina is Buenos Aires.' |
| q1-capital-0212 | San Jose | ✓ 'San Jose' | ✓ 'San Jose' | ✓ 'The capital of Costa Rica is San Jose.' | ✓ 'The capital of Costa Rica is San José.' |
| q1-capital-0213 | Ashgabat | ✗ 'Bashkert' | ✗ 'Bashkert' | ✓ 'The capital of Turkmenistan is Ashgabat.' | ✓ 'The capital of Turkmenistan is Ashgabat.' |
| q1-capital-0214 | Paris | ✓ 'Paris' | ✓ 'Paris' | ✓ 'The capital of France is Paris.' | ✓ 'The capital of France is Paris.' |
| q1-capital-0215 | Vienna | ✓ 'Vienna' | ✓ 'Vienna' | ✓ 'The capital of Austria is Vienna.' | ✓ 'The capital of Austria is Vienna.' |
| q1-capital-0216 | Minsk | ✓ 'Minsk' | ✓ 'Minsk' | ✗ 'Moscow' | ✗ 'Moscow' |
| q1-capital-0217 | Abu Dhabi | ✓ 'Abu Dhabi' | ✓ 'Abu Dhabi' | ✓ 'The capital of the United Arab Emirates is Abu Dha' | ✓ 'The capital of the United Arab Emirates is Abu Dha' |
| q1-capital-0218 | Pyongyang | ✓ 'Pyongyang' | ✓ 'Pyongyang' | ✓ 'The capital of North Korea is Pyongyang.' | ✓ 'The capital of North Korea is Pyongyang.' |
| q1-capital-0219 | Addis Ababa | ✗ 'Ababa' | ✗ 'Ababa' | ✓ "Ethiopia's capital is Addis Ababa." | ✓ 'The capital of Ethiopia is Addis Ababa.' |
| q1-capital-0220 | Freetown | ✗ 'Monrovia' | ✗ 'Monrovia' | ✗ 'The capital of Sierra Leone is called "Freetown."' | ✗ 'The capital of Sierra Leone is called "Leopoldvill' |
| q1-capital-0221 | Asuncion | ✗ 'Montevideo' | ✗ 'Montevideo' | ✓ 'The capital of Paraguay is Asuncion.' | ✓ 'The capital of Paraguay is Asuncion.' |
| q1-capital-0222 | Seoul | ✓ 'Seoul' | ✓ 'Seoul' | ✓ 'The capital of South Korea is Seoul.' | ✓ 'The capital of South Korea is Seoul.' |
| q1-capital-0223 | Washington | ✓ 'The capital of the United States is Washington D.C' | ✓ 'The capital of the United States is Washington D.C' | ✓ 'The capital of the United States is Washington D.C' | ✓ 'The capital of the United States is Washington D.C' |
| q1-capital-0224 | Moscow | ✓ 'Moscow' | ✓ 'Moscow' | ✓ 'The capital of Russia is Moscow.' | ✓ 'The capital of Russia is Moscow.' |
| q1-capital-0225 | Brussels | ✗ 'Bruges' | ✗ 'Bruges' | ✓ 'The capital of Belgium is Brussels.' | ✓ 'The capital of Belgium is Brussels.' |
| q1-capital-0226 | Tbilisi | ✓ 'Tbilisi' | ✓ 'Tbilisi' | ✗ 'აქახალიკ' | ✗ 'აქახალიკ' |
| q1-capital-0227 | Bamako | ✓ 'The capital of Mali is Bamako.' | ✓ 'The capital of Mali is Bamako.' | ✗ "The capital of Mali is N'Djamena." | ✗ "The capital of Mali is N'Djamena." |
| q1-capital-0228 | Brasilia | ✗ 'São Paulo' | ✗ 'São Paulo' | ✓ 'The capital of Brazil is Brasília.' | ✓ 'The capital of Brazil is Brasília.' |
| q1-capital-0229 | Belgrade | ✓ "Serbia's capital is Belgrade." | ✓ "Serbia's capital is Belgrade." | ✓ 'The capital of Serbia is Belgrade.' | ✓ 'The capital of Serbia is Belgrade.' |
| q1-capital-0230 | Ljubljana | ✓ 'Ljubljana' | ✓ 'Ljubljana' | ✗ "Slovenia's capital is Ljubljana, which is located" | ✗ "Slovenia's capital is Ljubljana (Ljub" |
| q1-capital-0231 | Bangkok | ✓ "Thailand's capital is Bangkok." | ✓ "Thailand's capital is Bangkok." | ✓ 'The capital of Thailand is Bangkok.' | ✓ 'The capital of Thailand is Bangkok.' |
| q1-capital-0232 | Bratislava | ✓ "Slovakia's capital is Bratislava." | ✓ "Slovakia's capital is Bratislava." | ✓ 'The capital of Slovakia is Bratislava.' | ✓ 'The capital of Slovakia is Bratislava.' |
| q1-capital-0233 | Kabul | ✗ 'Bashirabad' | ✗ 'Bashirabad' | ✓ 'The capital of Afghanistan is Kabul.' | ✓ 'The capital of Afghanistan is Kabul.' |
| q1-capital-0234 | Harare | ✗ 'Zimbabwe' | ✗ 'Zimbabwe' | ✓ 'The capital of Zimbabwe is Harare.' | ✓ 'The capital of Zimbabwe is Harare.' |
| q1-capital-0235 | Havana | ✓ "Cuba's capital is Havana." | ✓ "Cuba's capital is Havana." | ✓ 'The capital of Cuba is Havana.' | ✓ 'The capital of Cuba is Havana.' |
| q1-capital-0236 | Niamey | ✗ 'Nairobi' | ✗ 'Nairobi' | ✗ "The capital of Niger is N'Djamena." | ✓ 'The capital of Niger is Niamey.' |
| q1-capital-0237 | Quito | ✓ 'Quito' | ✓ 'Quito' | ✓ 'The capital of Ecuador is Quito.' | ✓ 'The capital of Ecuador is Quito.' |
| q1-capital-0238 | Stockholm | ✓ 'Stockholm' | ✓ 'Stockholm' | ✓ 'The capital of Sweden is Stockholm.' | ✓ 'The capital of Sweden is Stockholm.' |
| q1-capital-0239 | Tegucigalpa | ✓ 'Tegucigalpa' | ✓ 'Tegucigalpa' | ✓ 'The capital of Honduras is Tegucigalpa.' | ✓ 'The capital of Honduras is Tegucigalpa.' |
| q1-capital-0240 | Podgorica | ✓ "Montenegro's capital is Podgorica." | ✓ "Montenegro's capital is Podgorica." | ✓ 'The capital of Montenegro is Podgorica.' | ✓ 'The capital of Montenegro is Podgorica.' |
| q1-capital-0241 | Riga | ✗ 'Livonia' | ✗ 'Livonia' | ✓ 'The capital of Latvia is Riga.' | ✓ 'The capital of Latvia is Riga.' |
| q1-capital-0242 | Vilnius | ✗ 'Kalnieto' | ✗ 'Kalnieto' | ✗ 'Kalinka' | ✓ 'The capital of Lithuania is Vilnius.' |
| q1-capital-0243 | Damascus | ✓ 'Damascus' | ✓ 'Damascus' | ✓ 'The capital of Syria is Damascus.' | ✓ 'The capital of Syria is Damascus.' |
| q1-capital-0244 | Thimphu | ✗ "Bhutan's capital is Thimbu." | ✗ "Bhutan's capital is Thimbu." | ✗ 'The capital of Bhutan is Thimrikam.' | ✗ 'The capital of Bhutan is Thimrikam.' |
| q1-capital-0245 | Skopje | ✗ 'Macedonia' | ✗ 'Macedonia' | ✓ 'The capital of North Macedonia is Skopje.' | ✓ 'The capital of North Macedonia is Skopje.' |
| q1-capital-0246 | Bogota | ✗ 'Cartagena' | ✗ 'Cartagena' | ✓ 'The capital of Colombia is Bogotá.' | ✓ 'The capital of Colombia is Bogotá.' |
| q1-capital-0247 | Helsinki | ✓ 'Helsinki' | ✓ 'Helsinki' | ✓ 'The capital of Finland is Helsinki.' | ✓ 'The capital of Finland is Helsinki.' |
| q1-capital-0248 | Conakry | ✗ 'Monrovia' | ✗ 'Monrovia' | ✓ 'The capital of Guinea is Conakry.' | ✓ 'The capital of Guinea is Conakry.' |
| q1-capital-0249 | Caracas | ✓ 'Caracas' | ✓ 'Caracas' | ✓ 'The capital of Venezuela is Caracas.' | ✓ 'The capital of Venezuela is Caracas.' |
| q1-capital-0250 | Baku | ✗ 'Azerbaijan' | ✗ 'Azerbaijan' | ✓ 'The capital of Azerbaijan is Baku.' | ✓ 'The capital of Azerbaijan is Baku.' |
| q1-capital-0251 | Lisbon | ✗ 'Porto' | ✗ 'Porto' | ✓ 'The capital of Portugal is Lisbon.' | ✓ 'The capital of Portugal is Lisbon.' |
| q1-capital-0252 | Nairobi | ✓ "Kenya's capital is Nairobi." | ✓ "Kenya's capital is Nairobi." | ✓ 'The capital of Kenya is Nairobi.' | ✓ 'The capital of Kenya is Nairobi.' |
| q1-capital-0253 | Amman | ✓ 'Amman' | ✓ "Jordan's capital is Amman." | ✓ 'The capital of Jordan is Amman.' | ✓ 'The capital of Jordan is Amman.' |
| q1-capital-0254 | Mogadishu | ✓ "Somalia's capital is Mogadishu." | ✓ "Somalia's capital is Mogadishu." | ✓ 'The capital of Somalia is Mogadishu.' | ✓ 'The capital of Somalia is Mogadishu.' |
| q1-capital-0255 | Monrovia | ✓ 'Monrovia' | ✓ 'Monrovia' | ✓ 'The capital of Liberia is Monrovia.' | ✓ 'The capital of Liberia is Monrovia.' |
| q1-capital-0256 | Port-au-Prince | ✗ 'Saint-Domingue' | ✗ 'Saint-Domingue' | ✓ 'The capital of Haiti is Port-au-Prince.' | ✓ 'The capital of Haiti is Port-au-Prince.' |
| q1-capital-0257 | Kathmandu | ✗ 'Lhasa' | ✗ 'Lhasa' | ✓ 'The capital of Nepal is Kathmandu.' | ✓ 'The capital of Nepal is Kathmandu.' |
| q1-capital-0258 | Vientiane | ✓ 'Vientiane' | ✓ 'Vientiane' | ✓ 'The capital of Laos is Vientiane.' | ✓ 'The capital of Laos is Vientiane.' |
| q1-capital-0259 | Cairo | ✓ 'The capital of Egypt is Cairo.' | ✓ 'The capital of Egypt is Cairo.' | ✓ 'The capital of Egypt is Cairo.' | ✓ 'The capital of Egypt is Cairo.' |
| q1-capital-0260 | Santo Domingo | ✗ 'San Juan' | ✗ 'San Juan' | ✓ 'The capital of the Dominican Republic is Santo Dom' | ✓ 'The capital of the Dominican Republic is Santo Dom' |
| q1-capital-0261 | Tallinn | ✓ 'Estonian: Tallinn' | ✓ 'Estonian: Tallinn' | ✓ 'The capital of Estonia is Tallinn.' | ✓ 'The capital of Estonia is Tallinn.' |
| q1-capital-0262 | Tehran | ✗ 'Shiraz' | ✗ 'Shiraz' | ✓ 'The capital of Iran is Tehran.' | ✓ 'The capital of Iran is Tehran.' |
| q1-capital-0263 | Dakar | ✓ 'Dakar' | ✓ 'Dakar' | ✓ 'The capital of Senegal is Dakar.' | ✓ 'The capital of Senegal is Dakar.' |
| q1-capital-0264 | Ulaanbaatar | ✓ 'Ulaanbaatar' | ✓ 'Ulaanbaatar' | ✓ 'The capital of Mongolia is Ulaanbaatar' | ✓ 'The capital of Mongolia is Ulaanbaatar' |
| q1-capital-0265 | Doha | ✓ 'Doha' | ✓ 'Doha' | ✓ 'The capital of Qatar is Doha.' | ✓ 'The capital of Qatar is Doha.' |
| q1-capital-0266 | Valletta | ✗ 'Malta' | ✗ 'Malta' | ✓ 'The capital of Malta is Valletta.' | ✓ 'The capital of Malta is Valletta.' |
| q1-capital-0267 | N'Djamena | ✓ "Chad's capital is N'Djamena." | ✓ "Chad's capital is N'Djamena." | ✓ "The capital of Chad is N'Djamena." | ✗ 'The capital of Chad is Chadiani.' |
| q1-capital-0268 | Windhoek | ✓ 'The capital of Namibia is Windhoek.' | ✓ 'The capital of Namibia is Windhoek.' | ✓ 'The capital of Namibia is Windhoek.' | ✓ 'The capital of Namibia is Windhoek.' |
| q1-capital-0269 | Dhaka | ✓ 'Dhaka' | ✓ 'Dhaka' | ✓ 'Dhaka' | ✓ 'Dhaka' |
| q1-capital-0270 | Abuja | ✓ "Nigeria's capital is Abuja." | ✓ "Nigeria's capital is Abuja." | ✓ 'The capital of Nigeria is Abuja.' | ✓ 'The capital of Nigeria is Abuja.' |
| q1-capital-0271 | Khartoum | ✓ "Sudan's capital is Khartoum." | ✓ "Sudan's capital is Khartoum." | ✓ 'The capital of Sudan is Khartoum.' | ✓ 'The capital of Sudan is Khartoum.' |
| q1-capital-0272 | Kampala | ✓ 'Kampala' | ✓ 'Kampala' | ✓ 'The capital of Uganda is Kampala.' | ✓ 'The capital of Uganda is Kampala.' |
| q1-capital-0273 | Muscat | ✓ 'The capital of Oman is Muscat.' | ✓ 'The capital of Oman is Muscat.' | ✓ 'The capital of Oman is Muscat.' | ✓ 'The capital of Oman is Muscat.' |
| q1-capital-0274 | Wellington | ✗ 'Kerikeri' | ✗ 'Kerikeri' | ✓ 'The capital of New Zealand is Wellington.' | ✓ 'The capital of New Zealand is Wellington.' |
| q1-capital-0275 | San Salvador | ✓ 'San Salvador' | ✓ 'San Salvador' | ✓ 'The capital of El Salvador is San Salvador.' | ✓ 'The capital of El Salvador is San Salvador.' |
| q1-capital-0276 | Tripoli | ✓ 'Tripoli' | ✓ 'Tripoli' | ✓ 'The capital of Libya is Tripoli.' | ✓ 'The capital of Libya is Tripoli.' |
| q1-capital-0277 | Maputo | ✓ "Mozambique's capital is Maputo." | ✓ "Mozambique's capital is Maputo." | ✓ 'The capital of Mozambique is Maputo.' | ✓ 'The capital of Mozambique is Maputo.' |
| q1-capital-0278 | Kinshasa | ✓ 'Kinshasa' | ✓ 'Kinshasa' | ✗ 'The capital of the Democratic Republic of the Cong' | ✗ 'The capital of the Democratic Republic of the Cong' |
| q1-capital-0279 | Baghdad | ✓ 'Baghdad' | ✓ 'Baghdad' | ✓ 'The capital of Iraq is Baghdad.' | ✓ 'The capital of Iraq is Baghdad.' |
| q1-capital-0280 | Rome | ✓ 'Rome' | ✓ 'Rome' | ✓ 'The capital of Italy is Rome.' | ✓ 'Rome' |
| q1-capital-0281 | Montevideo | ✓ 'Montevideo' | ✓ 'Montevideo' | ✓ 'The capital of Uruguay is Montevideo.' | ✓ 'The capital of Uruguay is Montevideo.' |
| q1-capital-0282 | Hanoi | ✓ 'Hanoi' | ✓ 'Hanoi' | ✗ 'The capital of Vietnam is Ho Chi Minh City.' | ✗ 'The capital of Vietnam is Ho Chi Minh City.' |
| q1-capital-0283 | Naypyidaw | ✗ 'Myanmar is located in the eastern part of the coun' | ✗ 'Myanmar is the capital of Myanmar.' | ✓ 'The capital of Myanmar is Naypyidaw.' | ✓ 'The capital of Myanmar is Naypyidaw.' |
| q1-capital-0284 | Luanda | ✓ 'Luanda' | ✓ 'Luanda' | ✓ 'The capital of Angola is Luanda.' | ✓ 'The capital of Angola is Luanda.' |
| q1-capital-0285 | Yaounde | ✗ 'Cameroon' | ✗ 'Cameroon' | ✓ 'The capital of Cameroon is Yaoundé.' | ✓ 'The capital of Cameroon is Yaoundé.' |
| q1-capital-0286 | Port Moresby | ✓ "Papua New Guinea's capital is Port Moresby." | ✓ "Papua New Guinea's capital is Port Moresby." | ✗ 'Papua New Guinea is Port Harcourt.' | ✗ 'Papua New Guinea is Port Harcourt.' |
| q1-capital-0287 | Lusaka | ✗ 'Luzhi.' | ✗ 'Luzhi.' | ✓ 'The capital of Zambia is Lusaka.' | ✓ 'The capital of Zambia is Lusaka.' |
| q1-capital-0288 | Kyiv | ✓ 'Kyiv' | ✓ 'Kyiv' | ✓ 'The capital of Ukraine is Kiev.' | ✓ "Ukraine's capital is Kiev." |
| q1-capital-0289 | Algiers | ✓ 'The capital of Algeria is Algiers.' | ✓ 'The capital of Algeria is Algiers.' | ✓ 'The capital of Algeria is Algiers.' | ✓ 'The capital of Algeria is Algiers.' |
| q1-capital-0290 | Dushanbe | ✗ 'Tashkent' | ✗ 'Tashkent' | ✗ 'Tashkent' | ✗ 'Tashkent' |
| q1-capital-0291 | Warsaw | ✓ 'Warsaw' | ✓ 'Warsaw' | ✓ 'The capital of Poland is Warsaw.' | ✓ 'The capital of Poland is Warsaw.' |
| q1-capital-0292 | Bern | ✗ 'Zurich' | ✗ 'Zurich' | ✗ 'The capital of Switzerland is Zurich.' | ✗ 'The capital of Switzerland is Zurich.' |
| q1-capital-0293 | Phnom Penh | ✓ 'Phnom Penh' | ✓ 'Phnom Penh' | ✓ 'The capital of Cambodia is Phnom Penh.' | ✓ 'The capital of Cambodia is Phnom Penh.' |
| q1-capital-0294 | New Delhi | ✓ 'New Delhi' | ✓ 'New Delhi' | ✓ 'The capital of India is New Delhi.' | ✓ 'The capital of India is New Delhi.' |
| q1-capital-0295 | Prague | ✗ 'Praga' | ✗ 'Praga' | ✓ 'The capital of the Czech Republic is Prague.' | ✓ 'The capital of the Czech Republic is Prague.' |
| q1-capital-0296 | Antananarivo | ✗ 'Madagascar' | ✗ 'Madagascar' | ✓ 'The capital of Madagascar is Antananarivo.' | ✓ 'The capital of Madagascar is Antananarivo.' |
| q1-capital-0297 | Santiago | ✓ 'Santiago' | ✓ 'Santiago' | ✓ 'The capital of Chile is Santiago.' | ✓ 'The capital of Chile is Santiago.' |
| q1-capital-0298 | Suva | ✗ 'Fiji' | ✗ 'Fiji' | ✓ 'The capital of Fiji is Suva.' | ✓ 'The capital of Fiji is Suva.' |
| q1-capital-0299 | Gaborone | ✗ 'Botswana' | ✗ 'Botswana' | ✗ 'The capital of Botswana is Gabélleta.' | ✗ 'The capital of Botswana is Gabélleta.' |
| q1-compare-0100 | 38 | ✓ '38' | ✓ '38' | ✗ '36' | ✗ '16' |
| q1-compare-0101 | 81 | ✗ '92' | ✗ '92' | ✗ '92' | ✗ '92' |
| q1-compare-0102 | 33 | ✗ '78' | ✗ '78' | ✗ '13' | ✗ '13' |
| q1-compare-0103 | 85 | ✓ '85.' | ✓ '85.' | ✗ '80' | ✗ '80' |
| q1-compare-0104 | 80 | ✗ '53.' | ✗ '53.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0105 | 10 | ✗ '29.' | ✗ '29.' | ✓ '10' | ✓ '10 is smaller than 29.' |
| q1-compare-0106 | 95 | ✓ '95.' | ✓ '95.' | ✗ '97' | ✗ '97' |
| q1-compare-0107 | 32 | ✗ '76' | ✗ '76' | ✗ '16' | ✗ '12' |
| q1-compare-0108 | 94 | ✓ '94.' | ✓ '94.' | ✓ '94' | ✓ '94 is larger than 79.' |
| q1-compare-0109 | 61 | ✗ '43.' | ✗ '43.' | ✗ '1000000000000000' | ✗ '1. 61' |
| q1-compare-0110 | 91 | ✓ '91.' | ✓ '91.' | ✓ '91' | ✓ '91' |
| q1-compare-0111 | 84 | ✗ '21.' | ✗ '21.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0112 | 54 | ✗ '28.' | ✗ '28.' | ✗ '28 is larger than 54.' | ✗ '28 is larger than 54.' |
| q1-compare-0113 | 58 | ✓ '58' | ✓ '58' | ✓ '58' | ✓ '58' |
| q1-compare-0114 | 37 | ✓ '37.' | ✓ '37' | ✗ '173' | ✗ '173' |
| q1-compare-0115 | 29 | ✓ '29.' | ✓ '29.' | ✓ '29' | ✓ '29' |
| q1-compare-0116 | 24 | ✓ '24.' | ✓ '24.' | ✓ '24' | ✓ '24' |
| q1-compare-0117 | 71 | ✗ '19.' | ✗ '19.' | ✗ '19 is larger than 71.' | ✗ '19 is larger than 71.' |
| q1-compare-0118 | 28 | ✓ '28.' | ✓ '28.' | ✗ '17' | ✗ '17' |
| q1-compare-0119 | 37 | ✗ '92' | ✗ '92' | ✗ '92' | ✗ '92' |
| q1-compare-0120 | 28 | ✗ '33' | ✗ '33' | ✓ '28' | ✓ '28' |
| q1-compare-0121 | 67 | ✓ '67.' | ✓ '67.' | ✗ '1000000000000000' | ✗ '1. 67 is larger than 43.' |
| q1-compare-0122 | 54 | ✓ '54.' | ✓ '54.' | ✗ '1' | ✗ '1' |
| q1-compare-0123 | 44 | ✗ '90' | ✗ '90' | ✗ '10 is smaller than 44.' | ✗ '1000000000000000' |
| q1-compare-0124 | 78 | ✓ '78' | ✓ '78' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0125 | 76 | ✓ '76.' | ✓ '76.' | ✗ '1' | ✗ '1. 76 is larger than 43.' |
| q1-compare-0126 | 25 | ✗ '77.' | ✗ '77.' | ✓ '25' | ✓ '25 is smaller than 77.' |
| q1-compare-0127 | 27 | ✗ '17.' | ✗ '17.' | ✗ '17' | ✗ '17 is larger than 27.' |
| q1-compare-0128 | 55 | ✓ '55.' | ✓ '55.' | ✗ '1000000000000000' | ✗ '1. 55 is larger than 44.' |
| q1-compare-0129 | 77 | ✓ '77.' | ✓ '77.' | ✗ '18' | ✗ '18' |
| q1-compare-0130 | 70 | ✗ '61.' | ✗ '61.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0131 | 82 | ✗ '15.' | ✗ '15.' | ✗ '15 is larger than 82.' | ✗ '15 is larger than 82.' |
| q1-compare-0132 | 96 | ✗ '87.' | ✗ '87.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0133 | 18 | ✗ '50.' | ✗ '50.' | ✓ '18' | ✓ '18' |
| q1-compare-0134 | 80 | ✗ '15.' | ✗ '15.' | ✗ '15 is larger than 80.' | ✗ '15 is larger than 80.' |
| q1-compare-0135 | 69 | ✓ '69.' | ✓ '69.' | ✗ '12' | ✗ '12 is larger than 69.' |
| q1-compare-0136 | 64 | ✓ '64.' | ✓ '64.' | ✗ '1000000000000000' | ✗ '1. 64 is larger than 54.' |
| q1-compare-0137 | 33 | ✓ '33.' | ✓ '33.' | ✗ '15' | ✗ '15 is larger than 33.' |
| q1-compare-0138 | 72 | ✓ '72' | ✓ '72.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0139 | 44 | ✗ '10.' | ✗ '10.' | ✗ '10 is larger than 44.' | ✗ '10 is larger than 44.' |
| q1-compare-0140 | 54 | ✓ '54.' | ✓ '54.' | ✗ '81' | ✗ '1' |
| q1-compare-0141 | 36 | ✗ '41' | ✗ '41' | ✗ '16' | ✗ '16' |
| q1-compare-0142 | 18 | ✗ '28' | ✗ '28' | ✓ '18' | ✓ '18' |
| q1-compare-0143 | 87 | ✗ '29.' | ✗ '29.' | ✓ '87' | ✗ '29 is larger than 87.' |
| q1-compare-0144 | 80 | ✓ '80.' | ✓ '80.' | ✗ '12' | ✗ '12 is larger than 80.' |
| q1-compare-0145 | 48 | ✓ '48.' | ✓ '48.' | ✗ '1000000000000000' | ✗ '1) 79' |
| q1-compare-0146 | 25 | ✓ '25.' | ✓ '25.' | ✗ '22' | ✗ '22 is larger than 25.' |
| q1-compare-0147 | 72 | ✗ '49.' | ✗ '49.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0148 | 76 | ✓ '76.' | ✓ '76.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0149 | 46 | ✗ '55.' | ✗ '55.' | ✗ '1' | ✗ '1' |
| q1-compare-0150 | 92 | ✗ '67.' | ✗ '67.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0151 | 66 | ✓ '66.' | ✓ '66.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0152 | 13 | ✓ '13' | ✓ '13' | ✓ '13' | ✓ '13' |
| q1-compare-0153 | 53 | ✓ '53.' | ✓ '53.' | ✗ '15' | ✗ '15' |
| q1-compare-0154 | 59 | ✓ '59.' | ✓ '59.' | ✗ '93' | ✗ '93' |
| q1-compare-0155 | 87 | ✗ '16.' | ✗ '16.' | ✗ '16' | ✗ '16 is larger than 87.' |
| q1-compare-0156 | 81 | ✗ '30.' | ✗ '30.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0157 | 37 | ✗ '35.' | ✗ '35.' | ✓ '37' | ✓ '37' |
| q1-compare-0158 | 94 | ✗ '21.' | ✗ '21.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0159 | 34 | ✗ '86' | ✗ '86' | ✗ '86' | ✗ '1' |
| q1-compare-0160 | 18 | ✓ '18' | ✓ '18' | ✓ '18' | ✓ '18' |
| q1-compare-0161 | 59 | ✗ '89' | ✗ '89' | ✓ '59' | ✓ '59' |
| q1-compare-0162 | 50 | ✓ '50.' | ✓ '50.' | ✗ '12' | ✗ '12' |
| q1-compare-0163 | 95 | ✓ '95' | ✓ '95' | ✓ '95 is larger than 88.' | ✓ '95 is larger than 88.' |
| q1-compare-0164 | 49 | ✓ '49.' | ✓ '49.' | ✓ '49' | ✓ '49' |
| q1-compare-0165 | 77 | ✗ '93' | ✗ '93' | ✗ '93' | ✗ '93' |
| q1-compare-0166 | 90 | ✓ '90' | ✓ '90' | ✗ '1000000000000000' | ✓ '90' |
| q1-compare-0167 | 13 | ✓ '13.' | ✓ '13' | ✓ '13' | ✓ '13' |
| q1-compare-0168 | 86 | ✓ '86' | ✓ '86' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0169 | 48 | ✓ '48.' | ✓ '48.' | ✓ '48' | ✓ '48' |
| q1-compare-0170 | 27 | ✓ '27.' | ✓ '27.' | ✓ '27' | ✓ '27 is smaller than 79.' |
| q1-compare-0171 | 52 | ✓ '52.' | ✓ '52.' | ✗ '23' | ✗ '23 is larger than 52.' |
| q1-compare-0172 | 13 | ✓ '13' | ✓ '13' | ✓ '13' | ✓ '13' |
| q1-compare-0173 | 18 | ✓ '18' | ✓ '18' | ✓ '18' | ✓ '18' |
| q1-compare-0174 | 22 | ✓ '22' | ✓ '22' | ✗ '96' | ✗ '96' |
| q1-compare-0175 | 76 | ✓ '76.' | ✓ '76.' | ✗ '176' | ✗ '176 is larger than 37.' |
| q1-compare-0176 | 13 | ✗ '54.' | ✗ '54.' | ✓ '13' | ✓ '13' |
| q1-compare-0177 | 81 | ✗ '49.' | ✗ '49.' | ✓ '81' | ✓ '81' |
| q1-compare-0178 | 50 | ✗ '89' | ✗ '89' | ✓ '50' | ✓ '50' |
| q1-compare-0179 | 45 | ✓ '45.' | ✓ '45.' | ✗ '46' | ✗ '46' |
| q1-compare-0180 | 81 | ✗ '39.' | ✗ '39.' | ✓ '81' | ✗ '1000000000000000' |
| q1-compare-0181 | 14 | ✗ '56.' | ✗ '56.' | ✓ '14' | ✓ '14' |
| q1-compare-0182 | 29 | ✗ '67' | ✗ '67' | ✓ '29' | ✓ '29' |
| q1-compare-0183 | 50 | ✓ '50.' | ✓ '50.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0184 | 60 | ✓ '60.' | ✓ '60.' | ✗ '17' | ✗ '17' |
| q1-compare-0185 | 18 | ✓ '18' | ✓ '18' | ✓ '18' | ✓ '18' |
| q1-compare-0186 | 19 | ✗ '95.' | ✗ '95.' | ✓ '19' | ✓ '19' |
| q1-compare-0187 | 60 | ✗ '97.' | ✗ '97.' | ✓ '60' | ✗ '97' |
| q1-compare-0188 | 62 | ✗ '86' | ✗ '86' | ✗ '86' | ✗ '86' |
| q1-compare-0189 | 27 | ✗ '99.' | ✗ '99.' | ✓ '27' | ✓ '27' |
| q1-compare-0190 | 57 | ✗ '81.' | ✗ '81.' | ✗ '81' | ✗ '81' |
| q1-compare-0191 | 75 | ✗ '71.' | ✗ '71.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0192 | 20 | ✓ '20.' | ✓ '20.' | ✓ '20' | ✓ '20' |
| q1-compare-0193 | 38 | ✓ '38' | ✓ '38' | ✗ '1' | ✗ '1' |
| q1-compare-0194 | 43 | ✗ '74.' | ✗ '74' | ✗ '1' | ✗ '1. 74 is smaller.' |
| q1-compare-0195 | 78 | ✓ '78.' | ✓ '78.' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-compare-0196 | 35 | ✓ '35.' | ✓ '35.' | ✗ '87' | ✗ '87' |
| q1-compare-0197 | 29 | ✗ '43.' | ✗ '43.' | ✓ '29' | ✓ '29' |
| q1-compare-0198 | 19 | ✗ '22' | ✗ '22' | ✓ '19' | ✓ '19' |
| q1-compare-0199 | 62 | ✓ '62' | ✓ '62' | ✗ '1000000000000000' | ✗ '1000000000000000' |
| q1-sentiment-0400 | positive | ✓ 'positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0401 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0402 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0403 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The review is positive.' | ✗ 'negative' |
| q1-sentiment-0404 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0405 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0406 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The answer is positive.' | ✓ 'The answer is positive.' |
| q1-sentiment-0407 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0408 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0409 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0410 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0411 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The review is positive.' | ✗ 'negative' |
| q1-sentiment-0412 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0413 | positive | ✓ 'positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0414 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The answer is positive.' | ✓ 'The answer is positive.' |
| q1-sentiment-0415 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0416 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0417 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0418 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0419 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0420 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0421 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The answer is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0422 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0423 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0424 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0425 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0426 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0427 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The answer is positive.' |
| q1-sentiment-0428 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0429 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0430 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0431 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0432 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0433 | positive | ✓ 'positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0434 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0435 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0436 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0437 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0438 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The answer is positive.' | ✓ 'The answer is positive.' |
| q1-sentiment-0439 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0440 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0441 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The answer is positive.' | ✓ 'The answer is positive.' |
| q1-sentiment-0442 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The answer is positive.' | ✓ 'The answer is positive.' |
| q1-sentiment-0443 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0444 | positive | ✓ 'positive' | ✓ 'positive' | ✓ 'The answer is positive.' | ✓ 'The answer is positive.' |
| q1-sentiment-0445 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0446 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0447 | positive | ✓ 'Positive' | ✓ 'Positive' | ✓ 'The review is positive.' | ✓ 'The review is positive.' |
| q1-sentiment-0448 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0449 | positive | ✓ 'positive' | ✓ 'positive' | ✗ 'negative' | ✗ 'negative' |
| q1-sentiment-0450 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0451 | negative | ✗ 'positive' | ✗ 'positive' | ✗ 'The answer is positive.' | ✓ 'The answer is negative.' |
| q1-sentiment-0452 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0453 | negative | ✓ 'Negative' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0454 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0455 | negative | ✓ 'Negative.' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0456 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0457 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0458 | negative | ✓ 'Negative' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0459 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0460 | negative | ✓ 'Negative.' | ✓ 'Negative.' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0461 | negative | ✓ 'Negative.' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0462 | negative | ✗ 'positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0463 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0464 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0465 | negative | ✓ 'Negative' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0466 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0467 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0468 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0469 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0470 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0471 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0472 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0473 | negative | ✗ 'Positive' | ✗ 'Positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0474 | negative | ✓ 'Negative' | ✓ 'Negative' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0475 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0476 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0477 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0478 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0479 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0480 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The answer is negative.' |
| q1-sentiment-0481 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0482 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0483 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0484 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0485 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0486 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0487 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0488 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0489 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0490 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0491 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0492 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0493 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0494 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0495 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0496 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0497 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The answer is negative.' |
| q1-sentiment-0498 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
| q1-sentiment-0499 | negative | ✗ 'positive' | ✗ 'positive' | ✓ 'The review is negative.' | ✓ 'The review is negative.' |
