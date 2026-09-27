#!/usr/bin/env python3
"""Independent MMPI-1 Turkish arithmetic reference.

This module intentionally does not import, parse, or generate production TypeScript.
Its narrow production-audit purpose is to independently verify the source K table and
raw/K/T arithmetic. Source: Ceyhun & Oral (2003), pp. 24-27 and Table 30 (p. 195).
"""
from __future__ import annotations

import argparse
import json

K_TABLE = {
    0.5: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    0.4: [0, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 9, 9, 10, 10, 10, 11, 11, 12, 12],
    0.2: [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
}

# Only cells needed by this independent regression are included. Production norms
# remain in TypeScript; this duplicate is deliberately hand-maintained for comparison.
PD_MALE_MEAN = 22.22
PD_MALE_SD = 4.45


def k_addition(k_raw: int, ratio: float) -> int:
    if type(k_raw) is not int or not 0 <= k_raw <= 30:
        raise ValueError("K raw must be an integer in the source range 0..30")
    if ratio == 1.0:
        return k_raw
    if ratio not in K_TABLE:
        raise ValueError("unsupported K ratio")
    return K_TABLE[ratio][k_raw]


def linear_t(value: int | float, mean: float, sd: float, *, reverse: bool = False) -> float:
    if sd <= 0:
        raise ValueError("SD must be positive")
    delta = mean - value if reverse else value - mean
    unclamped = 50.0 + 10.0 * delta / sd
    return round(max(20.0, min(120.0, unclamped)) + 1e-12, 1)


def self_test() -> dict[str, object]:
    assert sum(len(column) for column in K_TABLE.values()) == 93
    assert k_addition(1, 0.4) == 1  # Turkish source table, not generic rounding
    assert k_addition(3, 0.4) == 2
    assert k_addition(4, 0.4) == 2
    corrected_pd = 25 + k_addition(4, 0.4)
    pd_t = linear_t(corrected_pd, PD_MALE_MEAN, PD_MALE_SD)
    assert pd_t == 60.7
    return {"status": "PASS", "cells": 93, "k4PdT": pd_t}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if not args.self_test:
        parser.error("use --self-test")
    print(json.dumps(self_test(), separators=(",", ":")))


if __name__ == "__main__":
    main()
