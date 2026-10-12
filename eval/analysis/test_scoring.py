import pytest

from scoring import normalise, score

CAPITAL = {"answers": ["Reykjavik"], "scorer": "phrase"}
LARGER = {"answers": ["67"], "scorer": "number"}
SUM = {"answers": ["95"], "scorer": "number"}
HOT = {"answers": ["cold"], "scorer": "phrase"}
NEG = {"answers": ["negative"], "scorer": "label", "labels": ["positive", "negative"]}
POS = {"answers": ["positive"], "scorer": "label", "labels": ["positive", "negative"]}


@pytest.mark.parametrize(
    "output, question, correct, strict",
    [
        # Bare answers
        ("Reykjavik", CAPITAL, True, True),
        ("57.", {"answers": ["57"], "scorer": "number"}, True, True),
        ('"Take"', {"answers": ["take", "receive"], "scorer": "phrase"}, True, True),
        ("**67**", LARGER, True, True),
        ("**Reykjavik**", CAPITAL, True, True),
        # Answer at the end of a sentence
        ("The capital of Iceland is Reykjavik.", CAPITAL, True, False),
        ("61 + 34 = 95", SUM, True, False),
        ("Answer: 95", SUM, True, False),
        ('The opposite of "buy" is "sell".', {"answers": ["sell"], "scorer": "phrase"}, True, False),
        # Answer at the start of a sentence
        ("Reykjavik is the capital of Iceland.", CAPITAL, True, False),
        ("67 is larger than 45.", LARGER, True, False),
        ("Cold is the opposite of hot.", HOT, True, False),
        # Wrong answers
        ("Sydney", {"answers": ["Canberra"], "scorer": "phrase"}, False, False),
        ("61 + 34 = 96", SUM, False, False),
        ("63", {"answers": ["45"], "scorer": "number"}, False, False),
        ("1000000000000000", {"answers": ["98"], "scorer": "number"}, False, False),
        ("45 is smaller than 67.", LARGER, False, False),
        # Mentioning the answer is not enough; a segment must equal it
        ("The capital is not Reykjavik but Akureyri.", CAPITAL, False, False),
        ('The opposite of "light" is "dark".', {"answers": ["light", "bright"], "scorer": "phrase"}, False, False),
        # Only the first line counts
        ("I am not sure.\nReykjavik", CAPITAL, False, False),
        ("", CAPITAL, False, False),
        # Labels
        ("negative", NEG, True, True),
        ("The review is negative.", NEG, True, False),
        ("positive", NEG, False, False),
        ("Negative. The tone is positive", NEG, False, False),
        ("This review is not positive.", NEG, False, False),
        ("This review is not negative, it is positive.", POS, True, False),
        ("Positive", POS, True, True),
    ],
)
def test_score(output, question, correct, strict):
    s = score(output, question)
    assert (s.correct, s.strict) == (correct, strict), s


def test_normalise():
    assert normalise("Bogotá") == "bogota"
    assert normalise("N'Djamena") == "ndjamena"
    assert normalise("Port-au-Prince") == "port au prince"
    assert normalise("-12") == "-12"
    assert normalise("1,000") == "1000"
    assert normalise("Washington, D.C.") == "washington d c"
