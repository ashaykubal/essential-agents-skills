# Anthropic Validator

Validates Claude Code assets (skills, hooks, agents, commands, MCP servers, and plugins) against official Anthropic standards. Fetches the latest documentation dynamically and falls back to bundled checklists when offline. Produces structured validation reports with severity-rated findings and specific remediation steps.

## Quick Start

```
/anthropic-validator path/to/your/skill.md
```

Run without arguments to validate the current project's assets.

## What It Does

- Fetches current Anthropic documentation for skills, hooks, agents, commands, MCP servers, and plugins
- Falls back to bundled reference checklists (in `references/`) when docs can't be fetched
- Spawns a `standards-reviewer` agent to perform critical analysis separate from the validator itself
- Rates each finding by severity: critical, high, medium, low
- Writes structured YAML reports to `logs/validations/`

## Required Agents

This skill spawns the `standards-reviewer` agent (included in `agents/standards-reviewer.md`). Make sure the agent file is installed in your project's `agents/` directory.

## Dependencies

- `subagent-prompting` — 4-part template for agent invocation
- `subagent-output-templating` — structured output format for logs

## Installation

Copy this skill folder and its dependencies into your project:

```bash
cp -r skills/anthropic-validator /path/to/project/.claude/skills/
cp -r skills/subagent-prompting /path/to/project/.claude/skills/
cp -r skills/subagent-output-templating /path/to/project/.claude/skills/
cp agents/standards-reviewer.md /path/to/project/agents/
```

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
