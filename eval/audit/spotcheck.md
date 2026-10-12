# Spot-check the blind judge

For each item, decide whether the judge's verdict is right. Only the **first line** of the model output counts,
and format doesn't matter ("The capital is X." is as good as "X"). Valid alternatives to the listed answers count.

Tick exactly one box per item by changing `[ ]` to `[x]`, save, then run:
`eval/.venv/Scripts/python eval/analysis/spotcheck.py score`

## 1. `a0441`

**Question:** What is the opposite of the word "sharp"? Answer with one word.

**Listed answers:** dull, blunt

**Model output (first line):** `"flat"`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 2. `a0434`

**Question:** What is the capital of Georgia? Answer with only the city name.

**Listed answers:** Tbilisi

**Model output (first line):** `Tbilisi`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 3. `a0028`

**Question:** What is the capital of Ireland? Answer with only the city name.

**Listed answers:** Dublin

**Model output (first line):** `The capital of Ireland is Dublin.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 4. `a0046`

**Question:** What is 54 - 44? Answer with only the number.

**Listed answers:** 10

**Model output (first line):** `54`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 5. `a0043`

**Question:** What is 73 - 61? Answer with only the number.

**Listed answers:** 12

**Model output (first line):** `73 - 61 = 7`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 6. `a0184`

**Question:** Is this review positive or negative? / Review: "I would happily recommend the camera; it was fantastic." / Answer with only one word: positive or negative.

**Listed answers:** positive

**Model output (first line):** `negative`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 7. `a0427`

**Question:** What is the opposite of the word "always"? Answer with one word.

**Listed answers:** never

**Model output (first line):** `Unpredictable.`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 8. `a0086`

**Question:** Which number is smaller, 54 or 61? Answer with only the number.

**Listed answers:** 54

**Model output (first line):** `54.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 9. `a0376`

**Question:** What is the opposite of the word "maximum"? Answer with one word.

**Listed answers:** minimum

**Model output (first line):** `One opposite of the word "maximum" is "minimum".`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 10. `a0414`

**Question:** What is the opposite of the word "arrive"? Answer with one word.

**Listed answers:** depart, leave

**Model output (first line):** `The opposite of "arrive" is "disappear".`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 11. `a0342`

**Question:** Is this review positive or negative? / Review: "The camera was useless." / Answer with only one word: positive or negative.

**Listed answers:** negative

**Model output (first line):** `The review is negative.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 12. `a0437`

**Question:** What is the capital of Belgium? Answer with only the city name.

**Listed answers:** Brussels

**Model output (first line):** `Bruges`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 13. `a0157`

**Question:** Which number is larger, 38 or 36? Answer with only the number.

**Listed answers:** 38

**Model output (first line):** `36`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 14. `a0128`

**Question:** What is the capital of New Zealand? Answer with only the city name.

**Listed answers:** Wellington

**Model output (first line):** `Kerikeri`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 15. `a0310`

**Question:** Which number is smaller, 29 or 10? Answer with only the number.

**Listed answers:** 10

**Model output (first line):** `10`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 16. `a0108`

**Question:** Is this review positive or negative? / Review: "The hotel room was not wonderful at all." / Answer with only one word: positive or negative.

**Listed answers:** negative

**Model output (first line):** `The review is negative.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 17. `a0018`

**Question:** What is the capital of Jordan? Answer with only the city name.

**Listed answers:** Amman

**Model output (first line):** `Amman`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 18. `a0297`

**Question:** Which number is larger, 77 or 18? Answer with only the number.

**Listed answers:** 77

**Model output (first line):** `18`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 19. `a0348`

**Question:** What is 83 - 79? Answer with only the number.

**Listed answers:** 4

**Model output (first line):** `83 - 79 = 4`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 20. `a0081`

**Question:** Which number is smaller, 43 or 29? Answer with only the number.

**Listed answers:** 29

**Model output (first line):** `29`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 21. `a0220`

**Question:** What is 62 - 41? Answer with only the number.

**Listed answers:** 21

**Model output (first line):** `62 - 41 = 20`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 22. `a0326`

**Question:** What is the capital of Ethiopia? Answer with only the city name.

**Listed answers:** Addis Ababa

**Model output (first line):** `Ethiopia's capital is Addis Ababa.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 23. `a0201`

**Question:** What is 10 + 15? Answer with only the number.

**Listed answers:** 25

**Model output (first line):** `10 + 15 = 25`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 24. `a0411`

**Question:** Which number is larger, 69 or 12? Answer with only the number.

**Listed answers:** 69

**Model output (first line):** `69.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 25. `a0370`

**Question:** Which number is larger, 39 or 81? Answer with only the number.

**Listed answers:** 81

**Model output (first line):** `39.`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 26. `a0440`

**Question:** Which number is larger, 28 or 54? Answer with only the number.

**Listed answers:** 54

**Model output (first line):** `28.`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 27. `a0260`

**Question:** Is this review positive or negative? / Review: "I would happily recommend the haircut; it was lovely." / Answer with only one word: positive or negative.

**Listed answers:** positive

**Model output (first line):** `positive`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 28. `a0190`

**Question:** Which number is smaller, 54 or 81? Answer with only the number.

**Listed answers:** 54

**Model output (first line):** `81`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 29. `a0278`

**Question:** Is this review positive or negative? / Review: "I would happily recommend the app; it was lovely." / Answer with only one word: positive or negative.

**Listed answers:** positive

**Model output (first line):** `negative`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 30. `a0227`

**Question:** What is the opposite of the word "legal"? Answer with one word.

**Listed answers:** illegal

**Model output (first line):** `The opposite of "legal" is "illegal".`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 31. `a0257`

**Question:** Is this review positive or negative? / Review: "I would happily recommend the concert; it was amazing." / Answer with only one word: positive or negative.

**Listed answers:** positive

**Model output (first line):** `negative`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 32. `a0137`

**Question:** Which number is smaller, 54 or 81? Answer with only the number.

**Listed answers:** 54

**Model output (first line):** `54.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 33. `a0461`

**Question:** Which number is smaller, 28 or 18? Answer with only the number.

**Listed answers:** 18

**Model output (first line):** `28`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 34. `a0445`

**Question:** Is this review positive or negative? / Review: "The delivery was terrible." / Answer with only one word: positive or negative.

**Listed answers:** negative

**Model output (first line):** `The review is negative.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 35. `a0014`

**Question:** Is this review positive or negative? / Review: "The book was not wonderful at all." / Answer with only one word: positive or negative.

**Listed answers:** negative

**Model output (first line):** `The review is negative.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 36. `a0186`

**Question:** What is the capital of Afghanistan? Answer with only the city name.

**Listed answers:** Kabul

**Model output (first line):** `Bashirabad`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree

## 37. `a0238`

**Question:** Which number is larger, 39 or 81? Answer with only the number.

**Listed answers:** 81

**Model output (first line):** `81`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 38. `a0163`

**Question:** What is the capital of Libya? Answer with only the city name.

**Listed answers:** Tripoli

**Model output (first line):** `The capital of Libya is Tripoli.`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 39. `a0464`

**Question:** What is 41 - 16? Answer with only the number.

**Listed answers:** 25

**Model output (first line):** `41 - 16 = 25`

**Judge says:** CORRECT

- [x] Agree
- [ ] Disagree

## 40. `a0194`

**Question:** Which number is larger, 49 or 81? Answer with only the number.

**Listed answers:** 81

**Model output (first line):** `49.`

**Judge says:** WRONG

- [x] Agree
- [ ] Disagree
