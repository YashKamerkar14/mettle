"""Statistics named in docs/analysis-plan.md."""

from __future__ import annotations

import math

import numpy as np
from scipy.stats import binomtest, norm


def wilson(successes: int, n: int, confidence: float = 0.95) -> tuple[float, float]:
    """Wilson score interval for a binomial proportion."""
    if n == 0:
        return (0.0, 1.0)
    z = norm.ppf(1 - (1 - confidence) / 2)
    p = successes / n
    denom = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / denom
    # At p = 0 or 1 the bound is exactly 0 or 1; avoid float residue there.
    lo = 0.0 if successes == 0 else max(0.0, centre - half)
    hi = 1.0 if successes == n else min(1.0, centre + half)
    return (lo, hi)


def mcnemar_exact(a_correct: np.ndarray, b_correct: np.ndarray) -> dict:
    """Exact McNemar test on paired binary outcomes (two-sided)."""
    a, b = np.asarray(a_correct, bool), np.asarray(b_correct, bool)
    only_a = int(np.sum(a & ~b))
    only_b = int(np.sum(~a & b))
    discordant = only_a + only_b
    p = 1.0 if discordant == 0 else binomtest(only_a, discordant, 0.5).pvalue
    return {"only_a": only_a, "only_b": only_b, "p": float(p)}


def paired_bootstrap_diff(
    a_correct: np.ndarray,
    b_correct: np.ndarray,
    resamples: int = 10_000,
    confidence: float = 0.95,
    seed: int = 0,
) -> tuple[float, float, float]:
    """Accuracy difference a - b with a percentile CI from resampling items."""
    a, b = np.asarray(a_correct, float), np.asarray(b_correct, float)
    diff = a - b
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(diff), size=(resamples, len(diff)))
    means = diff[idx].mean(axis=1)
    tail = (1 - confidence) / 2
    return (float(diff.mean()), float(np.quantile(means, tail)), float(np.quantile(means, 1 - tail)))


def holm(pvalues: list[float]) -> list[float]:
    """Holm-Bonferroni adjusted p-values, in the input order."""
    m = len(pvalues)
    order = sorted(range(m), key=lambda i: pvalues[i])
    adjusted = [0.0] * m
    running = 0.0
    for rank, i in enumerate(order):
        running = max(running, min(1.0, (m - rank) * pvalues[i]))
        adjusted[i] = running
    return adjusted
