# Code Review

Runs a structured code review across four distinct areas: security, type safety, linting, and coding standards. Each area is analyzed by a separate sub-agent to prevent bias bleeding between concerns. Starts with static tool checks (`just typecheck`, `just lint`) before moving to LLM-based judgment, so obvious issues get caught cheaply before burning tokens on deeper analysis.

## Quick Start

```
/code-review path/to/file.ts
```

Flags: `--sections security,type-safety` to limit scope. `--skip-static` to skip tool-based checks.

## What It Does

- Runs static analysis first (typecheck, lint) to catch mechanical issues
- Spawns 4 parallel sub-agents, one per review section (security, type safety, linting, coding standards)
- Each section uses reference patterns from `references/` and framework-specific rules from `frameworks/`
- Produces a consolidated report with severity-rated findings
- Writes diagnostic logs to `logs/diagnostics/`

## Dependencies

- `subagent-prompting` — 4-part template for agent invocation
- `subagent-output-templating` — structured output format for logs

## Installation

```bash
cp -r skills/code-review /path/to/project/.claude/skills/
cp -r skills/subagent-prompting /path/to/project/.claude/skills/
cp -r skills/subagent-output-templating /path/to/project/.claude/skills/
```

## Project Setup

The static analysis phase expects a `just` task runner with `typecheck` and `lint` recipes. If your project doesn't use `just`, the skill falls back to LLM-only review (static phase is skipped).

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
