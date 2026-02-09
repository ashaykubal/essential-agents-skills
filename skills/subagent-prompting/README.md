# Sub-Agent Prompting

A structured template for invoking sub-agents with clear instructions. Uses a 4-part format — Goal, Constraints, Context, Output — that reduces the guesswork sub-agents do and improves consistency of results. Also includes a model selection rubric for choosing the right model size based on task complexity.

## Quick Start

This is an internal skill loaded by other skills that orchestrate sub-agents. You don't invoke it directly.

Add `subagent-prompting` to your skill's `skills` frontmatter array to make the template available.

## What It Does

- Provides the 4-part prompt template (Goal, Constraints, Context, Output) for sub-agent invocation
- Includes a model selection rubric: Haiku for simple lookups, Sonnet for standard review/research, Opus for complex implementation
- Documents F# pipe syntax for chaining multi-stage workflows
- Reference examples in `references/examples.md` show the template applied to real tasks

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/subagent-prompting /path/to/project/.claude/skills/
```

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
