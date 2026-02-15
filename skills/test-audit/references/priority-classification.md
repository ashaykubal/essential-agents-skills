# Priority Classification

## P0: False Confidence

Tests that pass but should not be trusted:

| Rule | Impact |
|------|--------|
| T1 | Mock hides real failures - test always passes regardless of SUT behavior |
| T3+ | Broken integration chain - no real integration is tested |

## P1: Incomplete Verification

Tests that run real code but don't fully verify:

| Rule | Impact |
|------|--------|
| T2 | Call happened but effect not verified |
| T3 | Integration boundary mocked - partial integration only |

## P2: Pattern Issues

Style, organization, and disabled test issues:

| Rule | Impact |
|------|--------|
| T4 (.skip) | Test disabled — not running, medium severity |
| T4 (.only) | Focus marker — other tests excluded from CI, high severity |
| T4 (.todo) | Test placeholder — not implemented, low severity |
| Minor patterns | Style and organization recommendations |
