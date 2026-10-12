"""Generate the Mettle question set deterministically.

    python eval/questions/build.py

Writes two disjoint files next to this script:
  pilot.v1.jsonl      8 items per category, for calibration only
  questions.v1.jsonl  100 items per kept category, the frozen evaluation set

Every category's candidate pool is built and shuffled with a fixed seed, then
the pilot takes the first items and the main set takes the next ones, so no
pilot item can appear in the main set.

Each item records how it is scored:
  number  answer is an integer
  phrase  answer is one of a few accepted words or phrases
  label   answer is one of a closed set of labels
"""

from __future__ import annotations

import json
import random
import string
from pathlib import Path

from data import ANTONYMS, CAPITALS, DAYS, MONTHS, NEGATIVE_ADJ, POSITIVE_ADJ, REVIEW_ITEMS

SEED = 20261012
VERSION = 1
PILOT_PER_CATEGORY = 8
MAIN_PER_CATEGORY = 100
OUT = Path(__file__).parent

# Categories the pilot calibration dropped from the main set (see
# docs/analysis-plan.md). They stay in the pilot so the pilot file is unchanged,
# and are generated last so dropping them does not shift other categories.
DROPPED_FROM_MAIN = {"sequence"}


def item(category: str, subtype: str, prompt: str, answers: list, scorer: str, **extra) -> dict:
    return {
        "category": category,
        "subtype": subtype,
        "prompt": prompt,
        "answers": [str(a) for a in answers],
        "scorer": scorer,
        **extra,
    }


def split(pool: list[dict], rng: random.Random, n_pilot: int, n_main: int) -> tuple[list[dict], list[dict]]:
    pool = pool[:]
    rng.shuffle(pool)
    if len(pool) < n_pilot + n_main:
        raise ValueError(f"pool of {len(pool)} too small for {n_pilot}+{n_main}")
    return pool[:n_pilot], pool[n_pilot : n_pilot + n_main]


def capitals(rng: random.Random) -> tuple[list[dict], list[dict]]:
    pool = [
        item("capital", "capital", f"What is the capital of {country}? Answer with only the city name.", answers, "phrase")
        for country, answers in CAPITALS.items()
    ]
    return split(pool, rng, PILOT_PER_CATEGORY, MAIN_PER_CATEGORY)


def antonyms(rng: random.Random) -> tuple[list[dict], list[dict]]:
    pool = [
        item("antonym", "antonym", f'What is the opposite of the word "{word}"? Answer with one word.', answers, "phrase")
        for word, answers in ANTONYMS.items()
    ]
    return split(pool, rng, PILOT_PER_CATEGORY, MAIN_PER_CATEGORY)


def arithmetic(rng: random.Random) -> tuple[list[dict], list[dict]]:
    seen, pool = set(), []
    while len(pool) < 400:
        a, b = rng.randint(10, 99), rng.randint(10, 99)
        op = rng.choice("+-")
        if op == "-" and a < b:
            a, b = b, a
        if (a, op, b) in seen or a == b:
            continue
        seen.add((a, op, b))
        result = a + b if op == "+" else a - b
        subtype = "addition" if op == "+" else "subtraction"
        pool.append(item("arithmetic", subtype, f"What is {a} {op} {b}? Answer with only the number.", [result], "number"))
    return split(pool, rng, PILOT_PER_CATEGORY, MAIN_PER_CATEGORY)


def compare(rng: random.Random) -> tuple[list[dict], list[dict]]:
    seen, pool = set(), []
    while len(pool) < 400:
        a, b = rng.randint(10, 99), rng.randint(10, 99)
        if a == b or (a, b) in seen:
            continue
        seen.add((a, b))
        which = rng.choice(["larger", "smaller"])
        answer = max(a, b) if which == "larger" else min(a, b)
        pool.append(
            item(
                "compare",
                which,
                f"Which number is {which}, {a} or {b}? Answer with only the number.",
                [answer],
                "number",
                distractor=str(min(a, b) if which == "larger" else max(a, b)),
            )
        )
    return split(pool, rng, PILOT_PER_CATEGORY, MAIN_PER_CATEGORY)


def sentiment(rng: random.Random) -> tuple[list[dict], list[dict]]:
    def review(text: str, label: str, subtype: str) -> dict:
        prompt = (
            "Is this review positive or negative?\n"
            f'Review: "{text}"\n'
            "Answer with only one word: positive or negative."
        )
        return item("sentiment", subtype, prompt, [label], "label", labels=["positive", "negative"])

    positive = [review(f"The {i} was {a}.", "positive", "positive") for i in REVIEW_ITEMS for a in POSITIVE_ADJ]
    positive += [
        review(f"I would happily recommend the {i}; it was {a}.", "positive", "positive")
        for i in REVIEW_ITEMS
        for a in POSITIVE_ADJ
    ]
    negative = [review(f"The {i} was {a}.", "negative", "negative") for i in REVIEW_ITEMS for a in NEGATIVE_ADJ]
    negated = [
        review(f"The {i} was not {a} at all.", "negative", "negated") for i in REVIEW_ITEMS for a in POSITIVE_ADJ
    ]

    # Half positive; the negative half is split between plain and negated.
    pilot, main = [], []
    for pool, n_pilot, n_main in [(positive, 4, 50), (negative, 2, 25), (negated, 2, 25)]:
        p, m = split(pool, rng, n_pilot, n_main)
        pilot += p
        main += m
    return pilot, main


def sequences(rng: random.Random) -> tuple[list[dict], list[dict]]:
    def cyclic(names: list[str], subtype: str) -> list[dict]:
        out = []
        for s in range(len(names)):
            shown = [names[(s + k) % len(names)] for k in range(3)]
            nxt = names[(s + 3) % len(names)]
            out.append(
                item(
                    "sequence",
                    subtype,
                    f"What comes next in this sequence: {', '.join(shown)}, ...? Answer with one word.",
                    [nxt],
                    "phrase",
                )
            )
        return out

    letters = []
    upper = string.ascii_uppercase
    for s in range(len(upper) - 3):
        nxt = upper[s + 3]
        if nxt in "AI":  # would collide with the words "a" and "I" when scoring
            continue
        shown = ", ".join(upper[s : s + 3])
        letters.append(
            item(
                "sequence",
                "letters",
                f"What comes next in this sequence: {shown}, ...? Answer with only the letter.",
                [nxt],
                "phrase",
            )
        )

    numbers = []
    for start in range(1, 21):
        for step in range(2, 10):
            shown = ", ".join(str(start + k * step) for k in range(3))
            numbers.append(
                item(
                    "sequence",
                    "numbers",
                    f"What comes next in this sequence: {shown}, ...? Answer with only the number.",
                    [start + 3 * step],
                    "number",
                )
            )

    pilot, main = [], []
    for pool, n_main in [(cyclic(DAYS, "days"), 5), (cyclic(MONTHS, "months"), 10), (letters, 20), (numbers, 65)]:
        p, m = split(pool, rng, 2, n_main)
        pilot += p
        main += m
    return pilot, main


def main() -> None:
    rng = random.Random(SEED)
    pilot, full = [], []
    for build in (arithmetic, compare, capitals, antonyms, sentiment, sequences):
        p, m = build(rng)
        pilot += p
        full += [q for q in m if q["category"] not in DROPPED_FROM_MAIN]

    prompts = {q["prompt"] for q in pilot}
    assert not prompts & {q["prompt"] for q in full}, "pilot and main sets overlap"
    assert len({q["prompt"] for q in full}) == len(full), "duplicate prompts in main set"

    for name, items in [("pilot", pilot), ("questions", full)]:
        path = OUT / f"{name}.v{VERSION}.jsonl"
        with path.open("w", encoding="utf-8", newline="\n") as f:
            for i, q in enumerate(items):
                q = {"id": f"{name[0]}{VERSION}-{q['category']}-{i:04d}", **q}
                f.write(json.dumps(q, ensure_ascii=False) + "\n")
        counts: dict[str, int] = {}
        for q in items:
            counts[q["category"]] = counts.get(q["category"], 0) + 1
        print(f"{path.name}: {len(items)} items {counts}")


if __name__ == "__main__":
    main()
