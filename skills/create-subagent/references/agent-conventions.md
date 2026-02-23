# Agent Conventions

Conventions for generating Claude Code agents. The Stage 2 generator sub-agent references this to produce agents that follow the correct register, include proper configuration, and document permission requirements.

---

## System-Prompt Register

Agent bodies in `.claude/agents/` are system prompts. They define WHO the agent IS, not WHAT to DO.

### The Critical Distinction

**System-prompt register (CORRECT for agents):**

The body reads as identity, expertise, and behavioral guidelines.

```markdown
# Security Reviewer

You are a code security reviewer specializing in web application vulnerabilities. Your expertise covers OWASP top 10, injection attacks, authentication flaws, and cryptographic misuse.

## Your Mission

Analyze code changes for security vulnerabilities. You prioritize:
1. Input validation and sanitization
2. Authentication and authorization boundaries
3. Data exposure and information leakage
4. Dependency vulnerabilities

## How You Work

When reviewing code, you:
1. Read all changed files completely
2. Trace data flow from user input to output
3. Classify each finding by CVSS severity
4. Report findings in structured format with remediation guidance
```

**Task-instruction register (WRONG for agents):**

The body reads as step-by-step execution instructions.

```markdown
# Security Review Steps

## Steps
1. Read the files provided in the prompt
2. Look for security issues
3. Check for SQL injection
4. Check for XSS
5. Write a report to logs/security-review.md

## Output
Write findings to logs/security-review.md
```

### Why This Matters

- Agents run as forked contexts — the body IS the system prompt
- System prompts establish identity, which produces consistent behavior across invocations
- Task instructions belong in the invoking prompt (GOAL/CONSTRAINTS/CONTEXT/OUTPUT), not the agent definition
- Identity-based agents adapt to different tasks while maintaining consistent quality

### Register Checklist

When generating an agent body, verify:

- [ ] Opens with "You are a..." or equivalent identity statement
- [ ] Describes expertise and specialization areas
- [ ] Explains behavioral patterns ("When you encounter X, you...")
- [ ] Uses present tense, not imperative ("You analyze..." not "Analyze...")
- [ ] Protocol section describes HOW the agent works, not WHAT to do for a specific task
- [ ] Output section describes format conventions, not specific file paths for one invocation

---

## Frontmatter Structure

### Required Fields

```yaml
---
name: {agent-name}
description: {single-line description with "Use when..." trigger}
model: {haiku|sonnet|opus}
tools:
  - {tool-1}
  - {tool-N}
---
```

### Optional Fields

```yaml
skills:
  - {skill-dependency-1}
  - {skill-dependency-N}
```

### Model Selection Guidance

| Use Case | Model | Rationale |
|----------|-------|-----------|
| Quick lookups, simple classification | haiku | Fast, low-cost |
| Analysis, review, research, generation | sonnet | Balanced capability and speed |
| Complex implementation, architecture, novel problems | opus | Highest quality reasoning |

**Default to Sonnet** unless the task clearly requires Haiku's speed or Opus's depth.

### Tool Selection

Only include tools the agent actually needs. Common patterns:

| Agent Type | Typical Tools |
|------------|--------------|
| Read-only reviewer | Read, Glob, Grep, Write (for reports only) |
| Code writer | Read, Grep, Glob, Write, Edit, Bash |
| Research agent | Read, Glob, Grep, WebFetch, WebSearch |

---

## Stop Hooks

Agents that emit diagnostic output should have a Stop hook configured. The hook runs when the agent completes.

### Hook Configuration

Stop hooks are configured in `.claude/hooks.json` (or project-level hooks), NOT in the agent's frontmatter.

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "{agent-name}",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Agent {agent-name} completed'"
          }
        ]
      }
    ]
  }
}
```

### What to Document

Since Stop hooks must be configured separately (not in the agent .md file), the generated agent should include a "Permissions Setup" section that documents:

1. The Stop hook command to add
2. Where to add it (`.claude/hooks.json` or project hooks)
3. What the hook does (e.g., log completion, trigger follow-up)

---

## Permissions Setup

Tool permissions for agents cannot be enforced automatically. Generated agents must include manual permission setup documentation.

### Required Documentation

Every generated agent must include a section like:

```markdown
## Permissions Setup

This agent requires the following permissions to be configured in your project settings:

### Tool Permissions

Add to `.claude/settings.json` or `.claude/settings.local.json`:

\`\`\`json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Write($PROJECT_DIR/logs/*)"
    ]
  }
}
\`\`\`

### Hook Configuration (Optional)

If this agent emits diagnostic output, add a SubagentStop hook:

\`\`\`json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "{agent-name}",
        "hooks": [
          {
            "type": "command",
            "command": "echo '{agent-name} completed at $(date)' >> logs/agent-completions.log"
          }
        ]
      }
    ]
  }
}
\`\`\`
```

---

## Output Conventions

### Diagnostic Output

Agents that produce diagnostic output should follow this pattern:

```yaml
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
    report_path: "{path to main output}"
    verdict: "{pass/fail/complete/partial}"
```

### Log Output

All agent output goes to `$PROJECT_DIR/logs/`. The agent definition should specify:

```markdown
## Output

Write all output to `$PROJECT_DIR/logs/` directory (`$PROJECT_DIR` is the project root where `.claude/` lives):
- Main report: `$PROJECT_DIR/logs/{agent-name}-{timestamp}.{ext}`
- Diagnostics: `$PROJECT_DIR/logs/diagnostics/{agent-name}-{timestamp}.yaml`
```

**IMPORTANT**: `$PROJECT_DIR` ensures paths resolve to the project root, not the skill directory or CWD. Without this prefix, agents may write output into `.claude/skills/` or other incorrect locations.

---

## Invocation Documentation

Every generated agent should include an Invocation section:

```markdown
## Invocation

This agent is invoked via the **Task tool**:

| Method | How to Use |
|--------|-----------|
| **Direct** | `Task(subagent_type="{agent-name}", prompt="...")` |
| **Pipeline stage** | Referenced by orchestrator skills |
| **User request** | Ask Claude to "run the {agent-name}" |
```
