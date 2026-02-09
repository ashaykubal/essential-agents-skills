# Mock Detection

Deep analysis of mock usage in test files to determine whether each mock is appropriate or masking a real testing gap. Goes beyond surface-level detection. It traces data flow to distinguish mocks that isolate external dependencies (good) from mocks that replace the system under test (bad).

## Quick Start

This is an internal skill loaded automatically by `test-audit`. You don't invoke it directly.

## What It Does

- Analyzes each mock/stub/spy to determine what it replaces and whether that replacement is justified
- Distinguishes boundary mocks (external APIs, databases) from internal mocks (the code you're actually testing)
- Identifies "mock-heavy" tests where mocking has replaced meaningful verification
- Produces appropriateness ratings and rewrite suggestions for problematic mocks

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/mock-detection /path/to/project/.claude/skills/
```

Typically installed as part of the `test-audit` stack rather than on its own.

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
