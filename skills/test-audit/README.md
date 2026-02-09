# Test Audit

Audits your test suite for quality problems that undermine confidence in test results. Checks for mocked-out systems under test, assertions that verify function calls instead of actual output, integration tests that fake external dependencies, and skipped or disabled tests. Based on four rules (T1-T4) that distinguish tests providing real safety from tests that just pass.

## Quick Start

```
/test-audit path/to/tests/
```

Pass a directory to audit all test files, or a single file for focused analysis.

## What It Does

- Classifies test files by type (unit, integration, E2E) and identifies mock usage patterns
- Catches mocked systems under test (T1), call-counting assertions instead of output checks (T2), integration tests that fake external boundaries (T3), and skipped or disabled tests (T4)
- Scales automatically — deep analysis for small sets (5 files or fewer), batched pipeline for larger suites
- Produces severity-rated findings with rewrite suggestions

## Dependencies

This skill orchestrates several internal skills (all included in this collection):

- `test-classification` — categorizes test files by type and mock usage
- `mock-detection` — deep analysis of mock appropriateness
- `assertion-patterns` — patterns for rewriting violations into real assertions
- `component-patterns` — per-component verification approaches
- `bug-magnet-data` — edge case data for boundary testing suggestions

## Installation

Install the full test-audit stack:

```bash
# Core skill
cp -r skills/test-audit /path/to/project/.claude/skills/

# Required dependencies
cp -r skills/test-classification /path/to/project/.claude/skills/
cp -r skills/mock-detection /path/to/project/.claude/skills/
cp -r skills/assertion-patterns /path/to/project/.claude/skills/
cp -r skills/component-patterns /path/to/project/.claude/skills/
cp -r skills/bug-magnet-data /path/to/project/.claude/skills/
```

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
