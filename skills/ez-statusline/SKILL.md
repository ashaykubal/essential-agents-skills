---
name: ez-statusline
description: Configure a multi-line status bar for Claude Code. Supports init, preset switching, and customization.
user-invocable: true
tools:
  - Bash
  - Read
  - Edit
---

# EZ Status Line

Configure a multi-line status bar for Claude Code.

---

## When to Use

Use this skill when:
- Setting up the status line for the first time (`init`)
- Switching between status line presets (`minimal`, `developer`, `cost`)
- User asks to configure or customize the status line display

---

## Invocation

This skill can be invoked two ways:

| Method | Example |
|--------|---------|
| **Command** | `/ez-statusline minimal` |
| **Conversational** | "Change my status line to minimal" |

When invoked, **you (Claude) execute the steps** using the tools declared above (Bash, Read, Edit).

---

## Usage

```
/ez-statusline init        # Install with default (developer) preset
/ez-statusline minimal     # Switch to minimal preset (1 line)
/ez-statusline developer   # Switch to developer preset (3 lines)
/ez-statusline cost        # Switch to cost preset (2 lines)
```

### Argument Handling

The subcommand is passed via `$1`:

```
/ez-statusline init
               ^^^^
               $1 = "init"
```

Parse `$1` and execute the corresponding subcommand below.

---

## Subcommand: init

Install the status line for first-time setup.

**Execute these steps:**

1. **Bash**: Create config directory
   ```bash
   mkdir -p ~/.claude-statusline
   ```

2. **Bash**: Copy default config template
   ```bash
   cp ".claude/skills/ez-statusline/templates/statusline-default.yaml" ~/.claude-statusline/statusline.yaml
   ```

3. **Spawn statusline-setup agent** to update settings.json:
   ```
   Task(subagent_type="statusline-setup", prompt="
     GOAL: Add statusLine configuration to .claude/settings.json
     TARGET: .claude/settings.json (project level)

     EXACT JSON to add at top level of settings.json:
     {
       \"statusLine\": {
         \"type\": \"command\",
         \"command\": \".claude/skills/ez-statusline/scripts/statusline.sh\"
       }
     }

     If .claude/settings.json does not exist, create it with just this content.
     If it exists, merge the statusLine key into the existing JSON, preserving all other keys.
   ")
   ```

4. **Display to user**: "Status line installed. Restart session to activate."

---

## Subcommand: minimal

Switch to minimal preset (single line: model + gauge + tokens).

**Execute these steps:**

1. **Read**: `~/.claude-statusline/statusline.yaml`
2. **Edit**: Change `preset:` value to `minimal`
3. **Display to user**: "Switched to minimal preset."

---

## Subcommand: developer

Switch to developer preset (3 lines).

**Lines displayed:**
- Line 1: Model + gauge + tokens
- Line 2: Last modified file
- Line 3: Git branch + pending count

**Execute these steps:**

1. **Read**: `~/.claude-statusline/statusline.yaml`
2. **Edit**: Change `preset:` value to `developer`
3. **Display to user**: "Switched to developer preset."

---

## Subcommand: cost

Switch to cost preset (2 lines).

**Lines displayed:**
- Line 1: Model + gauge + tokens + cost
- Line 2: Duration

**Execute these steps:**

1. **Read**: `~/.claude-statusline/statusline.yaml`
2. **Edit**: Change `preset:` value to `cost`
3. **Display to user**: "Switched to cost preset."

---

## File Locations

| File | Purpose |
|------|---------|
| `~/.claude-statusline/statusline.yaml` | User config (presets, colors) |
| `.claude/skills/ez-statusline/scripts/statusline.sh` | Main script (bundled with skill) |
| `.claude/skills/ez-statusline/templates/statusline-default.yaml` | Default config template |

---

## Notes

- Status line updates automatically on each interaction
- Multi-line output is supported
- Colors use RGB escape codes for exact hex values
- Gauge and percentage colors match threshold (green/yellow/coral)
- Requires `jq` for JSON parsing and optionally `git` for branch display
