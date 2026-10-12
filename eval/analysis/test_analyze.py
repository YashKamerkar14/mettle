from analyze import min_margin, verdict

M = 0.05


def test_verdict_loss():
    assert verdict((0.02, 0.10), (0.03, 0.09), M) == "loss"


def test_verdict_small_loss_is_flagged_as_within_margin():
    assert verdict((0.005, 0.04), (0.01, 0.035), M) == "loss, but within the equivalence margin"


def test_verdict_equivalent():
    assert verdict((-0.04, 0.045), (-0.03, 0.04), M) == "equivalent"


def test_verdict_inconclusive_when_ci_is_wide():
    assert verdict((-0.03, 0.08), (-0.02, 0.07), M) == "inconclusive"


def test_verdict_gain():
    assert verdict((-0.10, -0.02), (-0.09, -0.03), M) == "gain"


def test_min_margin_ignores_nulls():
    assert min_margin([None, 2.0, 0.5]) == 0.5
    assert min_margin([None]) == float("inf")
