import numpy as np
import pytest

from stats import holm, mcnemar_exact, paired_bootstrap_diff, wilson


def test_wilson_known_value():
    lo, hi = wilson(50, 100)
    assert lo == pytest.approx(0.4038, abs=1e-3)
    assert hi == pytest.approx(0.5962, abs=1e-3)


def test_wilson_edges_stay_in_range():
    assert wilson(0, 10)[0] == 0.0
    assert wilson(10, 10)[1] == 1.0


def test_mcnemar_counts_discordant_pairs():
    a = np.array([1, 1, 1, 0, 1, 1])
    b = np.array([1, 0, 0, 0, 0, 1])
    r = mcnemar_exact(a, b)
    assert (r["only_a"], r["only_b"]) == (3, 0)
    assert r["p"] == pytest.approx(0.25)


def test_mcnemar_no_disagreement():
    assert mcnemar_exact(np.ones(5), np.ones(5))["p"] == 1.0


def test_bootstrap_brackets_the_point_estimate():
    rng = np.random.default_rng(1)
    a = rng.random(500) < 0.8
    b = rng.random(500) < 0.7
    d, lo, hi = paired_bootstrap_diff(a, b)
    assert lo < d < hi
    assert d == pytest.approx(a.mean() - b.mean())


def test_holm_matches_textbook_example():
    assert holm([0.01, 0.04, 0.03]) == pytest.approx([0.03, 0.06, 0.06])
