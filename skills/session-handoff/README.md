# Session Handoff

Creates structured handoff documents when ending a session or switching context. Captures progress, file changes, decisions, and next steps so the following session can pick up without re-reading everything.

## Quick Start

```
/session-handoff
```

Typically invoked at the end of a session or when approaching context window limits.

## What It Does

- Generates a markdown handoff document with YAML frontmatter for metadata
- Captures session summary, files created/modified, verification status, technical decisions, and next steps
- Documents blockers and open issues so nothing falls through the cracks
- Follows a consistent structure that makes handoffs scannable and searchable

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/session-handoff /path/to/project/.claude/skills/
```

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
