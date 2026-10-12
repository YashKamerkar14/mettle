"""Score model outputs against the answer key.

Two scores per answer, both computed on the first non-empty line only:

primary ("answer correct")
    phrase / number scorers: split the line into candidate segments and
    accept if any segment, after normalisation, exactly equals an accepted
    answer. Segments are: the whole line; the text before the first " is "
    ("Reykjavik is the capital of Iceland"); the text after the last " is "
    ("The capital of Iceland is Reykjavik"); and the text after the last "="
    or ":" ("61 + 34 = 95", "Answer: 95"). Segments must match exactly, so a
    sentence that merely mentions the answer somewhere does not count.
    label scorer: collect the labels mentioned in the line, ignoring any
    preceded by "not"; correct only if exactly one label is mentioned and it
    is the key ("Negative. The tone is positive" is wrong: two labels).

strict ("followed format")
    The whole first line, normalised, must equal the answer. Measures whether
    the model obeyed "answer with only ...".

Normalisation: lowercase, strip accents, delete apostrophes and quotes, turn
hyphens, markdown and other punctuation into spaces, collapse whitespace.
Numbers must normalise to a single integer.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

_IS = re.compile(r"\s+is\s+", re.IGNORECASE)
_MARKER = re.compile(r"[=:]")
_NEGATION = {"not", "isnt", "never"}


@dataclass(frozen=True)
class Score:
    extracted: str
    correct: bool
    strict: bool


def normalise(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower()
    text = re.sub(r"(?<=\d),(?=\d{3}\b)", "", text)  # 1,000 -> 1000
    text = re.sub(r"[\"'`‘’“”]", "", text)
    text = re.sub(r"[^\w\s-]|_", " ", text)
    text = re.sub(r"(?<=\w)-|-(?!\d)", " ", text)  # hyphens to spaces, keep a leading minus
    return " ".join(text.split())


def first_line(text: str) -> str:
    for line in text.strip().splitlines():
        if line.strip():
            return line.strip()
    return ""


def segments(line: str) -> list[str]:
    out = [line]
    parts = _IS.split(line)
    if len(parts) > 1:
        out += [parts[0], parts[-1]]
    marked = _MARKER.split(line)
    if len(marked) > 1:
        out.append(marked[-1])
    return [s.strip() for s in out if s.strip()]


def _equal(candidate: str, answers: list[str], scorer: str) -> bool:
    got = normalise(candidate)
    if not got:
        return False
    if scorer == "number":
        return re.fullmatch(r"-?\d+", got) is not None and any(int(got) == int(a) for a in answers)
    return any(got == normalise(a) for a in answers)


def mentioned_labels(line: str, labels: list[str]) -> set[str]:
    words = normalise(line).split()
    found = set()
    for i, w in enumerate(words):
        if w in labels and not (i > 0 and words[i - 1] in _NEGATION):
            found.add(w)
    return found


def score(output: str, question: dict) -> Score:
    answers, scorer = question["answers"], question["scorer"]
    line = first_line(output)
    strict = _equal(line, answers, "phrase" if scorer == "label" else scorer)

    if scorer == "label":
        found = mentioned_labels(line, question["labels"])
        extracted = ",".join(sorted(found))
        correct = found == {normalise(answers[0])}
        return Score(extracted=extracted, correct=correct, strict=strict)

    if scorer not in ("number", "phrase"):
        raise ValueError(f"unknown scorer {scorer!r}")
    matched = next((s for s in segments(line) if _equal(s, answers, scorer)), None)
    return Score(extracted=matched if matched is not None else line, correct=matched is not None, strict=strict)
