# Sub-Agent Output Templating

Defines how sub-agents should structure their output: YAML log format, task completion reports, and summary constraints. When multiple agents feed into a pipeline, consistent output format means each stage can reliably parse the previous stage's results without guessing at structure.

## Quick Start

This is an internal skill loaded by other skills that orchestrate sub-agents. You don't invoke it directly.

Add `subagent-output-templating` to your skill's `skills` frontmatter array to make the templates available.

## What It Does

- Defines the YAML log format for sub-agent reports (metadata, findings, summary)
- Provides the task completion report template (WHY / WHAT / TRADE-OFFS / RISKS)
- Sets summary constraints so main-thread responses stay concise while full reasoning goes to logs
- Reference examples in `references/examples.md` show real output formatted to spec

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/subagent-output-templating /path/to/project/.claude/skills/
```

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
