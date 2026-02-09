# Test Classification

Categorizes test files by type (unit, integration, E2E) and analyzes their mock usage patterns. This is the first stage of the test-audit pipeline — it produces a classification report that downstream skills use to decide which files need deeper analysis.

## Quick Start

This is an internal skill loaded automatically by `test-audit`. You don't invoke it directly.

## What It Does

- Reads test files and classifies them as unit, integration, or E2E based on imports, structure, and test patterns
- Identifies mock/stub/spy usage and categorizes the mocking approach
- Flags files with high mock density for follow-up by `mock-detection`
- Handles batching for large test suites (20+ files)

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/test-classification /path/to/project/.claude/skills/
```

Typically installed as part of the `test-audit` stack rather than on its own.

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
