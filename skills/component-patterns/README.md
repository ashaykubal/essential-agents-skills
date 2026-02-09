# Component Patterns

Per-component-type verification approaches for generating meaningful test scripts. When you need to test an HTTP server, a CLI command, a database layer, a file parser, an external API client, or a process spawner, this skill provides the right verification strategy for each.

## Quick Start

This is an internal skill loaded automatically by `test-audit` and other testing tools. You don't invoke it directly.

## What It Does

- Defines verification strategies for 6 component types: HTTP servers, CLI commands, databases, file parsers, external APIs, and process spawners
- Each pattern specifies what to start, what to send, and what to check — grounded in real system interaction, not mocks
- Reference files in `references/` provide detailed per-pattern guidance
- Used by test rewrite workflows to generate replacement tests that exercise real behavior

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/component-patterns /path/to/project/.claude/skills/
```

Typically installed as part of the `test-audit` stack rather than on its own.

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
