"""Score model outputs against the answer key.

Two scores per answer:

primary ("extracted")
    Take the first line of the output. If it contains an answer marker
    (" is ", "=", ":"), keep only the text after the last one, so
    "The capital of Iceland is Reykjavik." -> "Reykjavik" and
    "61 + 34 = 95" -> "95". Normalise, then require an exact match with one
    of the accepted answers. Measures whether the model knows the answer.

strict
    Normalise the whole first line and require an exact match, with no
    extraction. Measures whether the model also followed "answer with only ...".

Normalisation: lowercase, strip accents, delete apostrophes and quotes, turn
hyphens and other punctuation into spaces, collapse whitespace. Numbers must
parse as a single integer (commas allowed as thousands separators).
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

_MARKERS = re.compile(r"\s+is\s+|=|:")
_INTEGER = re.compile(r"^-?\d{1,3}(,\d{3})*$|^-?\d+$")


@dataclass(frozen=True)
class Score:
    extracted: str
    correct: bool
    strict: bool


def normalise(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower()
    text = re.sub(r"[\"'`‘’“”]", "", text)
    text = re.sub(r"[^\w\s]", " ", text)
    return " ".join(text.split())


def first_line(text: str) -> str:
    for line in text.strip().splitlines():
        if line.strip():
            return line.strip()
    return ""


def extract(text: str) -> str:
    line = first_line(text)
    parts = _MARKERS.split(line)
    return parts[-1].strip() if parts else line


def _as_int(text: str) -> int | None:
    t = text.strip().rstrip(".").strip()
    return int(t.replace(",", "")) if _INTEGER.match(t) else None


def matches(candidate: str, answers: list[str], scorer: str) -> bool:
    if scorer == "number":
        value = _as_int(candidate)
        return value is not None and any(value == int(a) for a in answers)
    if scorer in ("phrase", "label"):
        got = normalise(candidate)
        return got != "" and any(got == normalise(a) for a in answers)
    raise ValueError(f"unknown scorer {scorer!r}")


def score(output: str, question: dict) -> Score:
    answers, scorer = question["answers"], question["scorer"]
    extracted = extract(output)
    return Score(
        extracted=extracted,
        correct=matches(extracted, answers, scorer),
        strict=matches(first_line(output), answers, scorer),
    )
