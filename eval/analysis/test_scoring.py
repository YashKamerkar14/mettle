from scoring import extract, normalise, score

CAPITAL = {"answers": ["Reykjavik"], "scorer": "phrase"}
NUMBER = {"answers": ["95"], "scorer": "number"}
LABEL = {"answers": ["negative"], "scorer": "label"}


def test_bare_answer_is_correct_and_strict():
    s = score("Reykjavik", CAPITAL)
    assert s.correct and s.strict


def test_sentence_answer_is_correct_but_not_strict():
    s = score("The capital of Iceland is Reykjavik.", CAPITAL)
    assert s.correct and not s.strict


def test_wrong_city_is_wrong():
    assert not score("Sydney", {"answers": ["Canberra"], "scorer": "phrase"}).correct


def test_equation_takes_the_result():
    assert score("61 + 34 = 95", NUMBER).correct
    assert not score("61 + 34 = 96", NUMBER).correct


def test_echoing_an_operand_is_wrong():
    assert not score("63", {"answers": ["45"], "scorer": "number"}).correct


def test_runaway_number_is_wrong():
    assert not score("1000000000000000", {"answers": ["98"], "scorer": "number"}).correct


def test_trailing_period_on_number():
    s = score("57.", {"answers": ["57"], "scorer": "number"})
    assert s.correct and s.strict


def test_label_in_sentence():
    assert score("The review is negative.", LABEL).correct
    assert not score("positive", LABEL).correct


def test_answer_on_later_line_is_ignored():
    assert not score("I am not sure.\nReykjavik", CAPITAL).correct


def test_accents_quotes_and_hyphens():
    assert normalise("Bogotá") == "bogota"
    assert normalise("N'Djamena") == "ndjamena"
    assert normalise("Port-au-Prince") == "port au prince"
    assert score('"Take"', {"answers": ["take", "receive"], "scorer": "phrase"}).correct


def test_quoted_answer_after_is():
    assert extract('The opposite of "buy" is "sell".') == '"sell".'
    assert score('The opposite of "buy" is "sell".', {"answers": ["sell"], "scorer": "phrase"}).correct


def test_prompt_word_echo_does_not_count():
    # Containment scoring would wrongly accept this; extraction does not.
    assert not score('The opposite of "light" is "dark".', {"answers": ["light", "bright"], "scorer": "phrase"}).correct


def test_empty_output():
    s = score("", CAPITAL)
    assert not s.correct and not s.strict
