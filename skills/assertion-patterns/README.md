# Assertion Patterns

Reference patterns for transforming tests that verify mock calls into tests that verify real output. When a test audit finds a violation — say, a test that checks `mockDb.query.toHaveBeenCalledWith(...)` instead of checking the actual query result — this skill provides the rewrite pattern to fix it.

## Quick Start

This is an internal skill loaded automatically by `test-audit`. You don't invoke it directly.

## What It Does

- Provides before/after transformation patterns for common assertion anti-patterns
- Covers mock-call assertions, spy verifications, and shallow snapshot tests
- Each pattern includes the anti-pattern, why it's a problem, and the concrete rewrite
- Organized by violation type (T1 through T4) for direct mapping to audit findings

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/assertion-patterns /path/to/project/.claude/skills/
```

Typically installed as part of the `test-audit` stack rather than on its own.

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
