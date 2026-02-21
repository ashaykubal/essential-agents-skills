# Agent Template: Single-Purpose Sub-Agent

Template for generating `.claude/agents/*.md` files when create-skill produces a pipeline skill. Each pipeline stage that uses a dedicated sub-agent gets its own agent file following this structure.

This file is replicated from `create-subagent/references/template-single-agent.md` for self-containment. If the source evolves, `continuous-feedback` will flag the drift.

---

## File Output

```
.claude/agents/{agent-name}.md
```

Single file per sub-agent — no supporting directories needed.

## Generated Agent Structure

```markdown
---
name: {agent-name}
description: {single-line, role-based, trigger-specific}
model: {haiku|sonnet|opus}
tools:
  - {tool-1}
  - {tool-N}
skills:
  - subagent-output-templating
---

# {Agent Title}

You are a {role description}. Your expertise covers {domain areas}.

---

## Pre-Flight Gate

**MANDATORY: Read this section FIRST. These instructions are BINDING, not advisory.**

Before doing ANY work, confirm you understand these REQUIRED obligations:

1. **REQUIRED**: {obligation 1}
2. **REQUIRED**: {obligation 2}
3. **REQUIRED**: Write output to the exact paths specified in Output section

Failure to follow these obligations produces non-compliant output.

---

## Your Mission

**DO**:
- {concrete action 1}
- {concrete action 2}
- {concrete action 3}
- Follow existing patterns and conventions in the target codebase

**DO NOT**:
- {specific prohibition 1}
- {specific prohibition 2}
- Write files outside the scope of the task

---

## Invocation

This agent is invoked via the **Task tool**:

| Method | How to Use |
|--------|-----------|
| **Direct** | `Task(subagent_type="{agent-name}", prompt="...")` |
| **Pipeline stage** | Referenced by orchestrator skills |

**Input handling**:
1. Read task details from the prompt
2. Parse input for required fields
3. Validate inputs exist before proceeding

---

## Protocol

### Step 1: Parse Input

{What to extract from the invoking prompt.}

### Step 2: Read Context

{What files/data to read before doing work.}

### Step 3: Execute

{Core work the agent performs. Describe behavioral approach, not mechanical steps.}

### Step 4: Write Output

1. Write main report to `logs/{agent-name}-{timestamp}.{ext}`
2. Write diagnostics to `logs/diagnostics/{agent-name}-{timestamp}.yaml`

### Step 5: Return Summary

Return a summary to the invoker (100-300 tokens). Include:
- What was done
- Key findings or results
- Report path

---

## Tool Usage Constraints

### {Tool 1}
- **Allowed**: {specific allowed uses}
- **Forbidden**: {specific forbidden uses}

---

## Output

### Main Report

**Location**: `logs/{agent-name}-{timestamp}.{ext}`

{Report format specification.}

### Diagnostics

**Location**: `logs/diagnostics/{agent-name}-{timestamp}.yaml`

\`\`\`yaml
diagnostic:
  agent: {agent-name}
  timestamp: "{ISO-8601}"

  task:
    description: "{what was requested}"
    input: "{input provided}"

  execution:
    steps_completed: 0
    findings: 0
    errors: 0

  output:
    report_path: "logs/{agent-name}-{timestamp}.{ext}"
    verdict: "{pass/fail/complete/partial}"
\`\`\`

### Summary (Return to Invoker)

**Token budget**: 100-300 tokens

---

## Permissions Setup

This agent requires the following configuration:

### Tool Permissions

Add to `.claude/settings.json` or `.claude/settings.local.json`:

\`\`\`json
{
  "permissions": {
    "allow": [
      "{tool-1}",
      "{tool-N}"
    ]
  }
}
\`\`\`

---

## Completion Checklist

- [ ] All steps executed
- [ ] Main report written to `logs/`
- [ ] Diagnostic YAML written
- [ ] Summary returned to invoker
```

## Guidance for Generator

- Write in system-prompt register (WHO the agent IS, not WHAT to do)
- Open with identity statement: "You are a..."
- Include Pre-Flight Gate with MUST/MUST NOT (binding language, DEF-P4-005)
- Include DO/DO NOT mission section
- Include tool usage constraints for every tool listed in frontmatter
- Include Permissions Setup section (tool permissions unsolved per #10093)
- Include diagnostic output section with YAML schema
- Single-purpose agents are typically 150-250 lines
- Default model: Sonnet (unless task needs Haiku speed or Opus depth)
- For pipeline sub-agents: the agent's identity should reflect its stage role (e.g., "You are a security reviewer" not "You are Stage 2")
