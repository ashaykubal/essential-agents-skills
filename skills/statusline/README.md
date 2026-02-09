# Statusline

A multi-line status display for Claude Code that shows context window usage, model info, last modified file, and git status, right in your terminal. Uses pastel RGB colors and a visual gauge bar that shifts from green to yellow to coral as your context fills up.

## Quick Start

```
/statusline init
```

This copies the config template, installs the status script, and updates your Claude Code settings.

Switch presets:
```
/statusline minimal
/statusline developer
/statusline cost
```

## What It Does

- Shows a context gauge bar with color-coded fill (green under 60%, yellow 60-70%, coral above 70%)
- Displays current model with a tinted background badge (purple for Opus, blue for Sonnet, teal for Haiku)
- Shows the last modified file path and git branch with pending commit count
- Three built-in presets: minimal (1 line), developer (3 lines), cost (2 lines with token cost and duration)
- Config lives at `~/.claude-statusline/statusline.yaml`

## Required Agents

This skill uses the `statusline-setup` agent (included in `agents/statusline-setup.md`) to safely update your Claude Code `settings.json`. Make sure the agent file is installed in your project's `agents/` directory.

## Dependencies

None beyond the bundled script and config template.

## External Requirements

- `jq` — required for JSON parsing (install via your package manager)
- `git` — optional, used for branch/commit display (degrades gracefully without it)

## Installation

```bash
# Skill
cp -r skills/statusline /path/to/project/.claude/skills/

# Agent
cp agents/statusline-setup.md /path/to/project/agents/

# Script (must be executable)
mkdir -p /path/to/project/scripts/statusline
cp scripts/statusline/statusline.sh /path/to/project/scripts/statusline/
chmod +x /path/to/project/scripts/statusline/statusline.sh
```

Then run `/statusline init` to complete setup.

## Known Limitations

The YAML config file (`~/.claude-statusline/statusline.yaml`) is not yet read by the statusline script at runtime. Preset switching updates the config file but the script currently uses hardcoded display settings. A future update will wire the config to the script.

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.
