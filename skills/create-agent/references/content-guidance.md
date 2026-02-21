# Content Guidance

Instruction writing patterns, description rules, and common pitfalls for generating high-quality agents. The Stage 2 generator sub-agent references this alongside agent-conventions.md to produce agents that behave reliably and instruct clearly.

---

## Description Field Rules

The YAML frontmatter `description` field controls agent discovery and activation.

### Format Rules

1. **Single line only.** Multi-line descriptions silently break discovery.
2. **Maximum ~200 characters.** Longer descriptions get truncated in menus.
3. **Start with an action noun or role.** "Code-writing agent that...", "Critical analysis of..."

### "When to Use" Framing

The description must tell the invoker WHEN to use this agent.

**Good — trigger-specific:**
```yaml
description: Code-writing agent that implements fixes and features following project standards. Quality enforced by direct implementer-quality.sh invocation after each Write/Edit.
```

**Bad — vague:**
```yaml
description: An agent for implementing code changes.
```

**Bad — too broad:**
```yaml
description: Helps with code and testing across various projects and frameworks.
```

### Pattern

```
{Role/action} that {what it does} {using what method/standard}. {Quality/safety note if applicable}.
```

---

## System-Prompt Writing Patterns

How to write agent bodies that produce consistent, reliable behavior. See agent-conventions.md for the full system-prompt vs task-instruction distinction.

### Identity First

Open with a clear identity statement. This anchors all subsequent behavior.

**Good:**
```markdown
You are a meticulous standards reviewer for Claude Code assets. Your role is to critically analyze assets against official standards and produce structured validation reports.
```

**Bad:**
```markdown
This document describes how to review standards.
```

### Expertise Anchoring

After identity, establish expertise areas. This constrains behavior to relevant domains.

**Good:**
```markdown
Your expertise covers:
- OWASP top 10 vulnerabilities
- Authentication and authorization patterns
- Input validation and sanitization
- Cryptographic best practices
```

**Bad:**
```markdown
You know about security stuff.
```

### Behavioral Patterns Over Procedures

Describe HOW the agent behaves, not step-by-step task execution.

**Good:**
```markdown
When reviewing code, you:
1. Read all changed files completely before forming any opinion
2. Trace data flow from input boundaries to output
3. Classify findings by severity using CVSS scoring
4. Provide specific remediation for every finding
```

**Bad:**
```markdown
Steps:
1. Read file A
2. Read file B
3. Write report to logs/review.md
```

---

## Binding Language for Agents

Without explicit binding language, Claude treats agent instructions as suggestions.

### Pre-Flight Gate Pattern

```markdown
## Pre-Flight Gate

**MANDATORY: Read this section FIRST. These instructions are BINDING, not advisory.**

Before doing ANY work, confirm you understand these REQUIRED obligations:

1. **REQUIRED**: [obligation 1]
2. **REQUIRED**: [obligation 2]

Failure to follow these obligations produces non-compliant output.
```

### Mission DO/DO NOT Pattern

```markdown
## Mission

**DO**:
- [concrete action 1]
- [concrete action 2]

**DO NOT**:
- [specific prohibition 1]
- [specific prohibition 2]
```

### Anti-Thought Traps

Address rationalizations Claude uses to skip obligations:

```markdown
If you find yourself thinking "this step isn't necessary for this particular task" — STOP.
The obligation exists for consistency across all invocations, not just this one.
```

---

## Common Pitfalls

### Pitfall 1: Task-Instruction Register

Writing an agent body as step-by-step task instructions instead of identity and behavioral guidelines. See agent-conventions.md for the full distinction and examples.

**Impact**: Agent behaves inconsistently because it has no stable identity to anchor behavior.

### Pitfall 2: Over-Specified Output Paths

Hardcoding specific file paths in the agent body for a single use case.

```markdown
# WRONG — too specific
Write your report to logs/security-review-PR-123.md

# CORRECT — parameterized convention
Write your report to logs/{agent-name}-{timestamp}.md
```

**Impact**: Agent only works for one invocation pattern.

### Pitfall 3: Missing Tool Constraints

Agents with Write/Edit/Bash access but no constraints on what they can modify.

**Prevention**: Include explicit allowed/forbidden sections:

```markdown
## Tool Usage Constraints

### Write
- **Allowed**: Source files (within scope), logs/
- **Forbidden**: Config files, files outside task scope

### Bash
- **Allowed**: Quality checks, read-only git, file inspection
- **Forbidden**: Git modifications, package installation, destructive commands
```

### Pitfall 4: No Diagnostic Output

Agents that complete work but produce no observable artifact for the orchestrator.

**Prevention**: Always include a diagnostic output section, even for simple agents:

```markdown
## Diagnostic Output

Write to: logs/diagnostics/{agent-name}-{timestamp}.yaml
```

### Pitfall 5: Missing Permissions Documentation

Agent works in development but fails in other environments because tool permissions aren't documented.

**Prevention**: Always include a "Permissions Setup" section (see agent-conventions.md).

### Pitfall 6: Undocumented Skill Dependencies

Agent silently depends on skills listed in frontmatter but doesn't reference them in the body.

**Prevention**: Include a "Related Skills" section explaining what each skill dependency provides.

---

## Generate-and-Customize Contract

All generated agents are scaffolds, not production-ready output.

### Required Disclaimer

Every generated agent should include this understanding in the post-generation summary:

```
This is a scaffold — a starting point for your agent. You should:
1. Review and customize the identity and expertise sections
2. Adjust tool permissions to match your project's security requirements
3. Configure permissions in .claude/settings.json
4. Test by invoking via Task tool and reviewing output quality
5. Add project-specific protocol steps as needed
```

### Why This Matters

Agent bodies define system prompts that anchor all behavior. A generic scaffold provides structure, but domain expertise and project-specific conventions must be customized by the user.
