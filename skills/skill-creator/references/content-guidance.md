# Content Guidance

Instruction writing patterns, description rules, and common pitfalls for generating high-quality skills. The Stage 2 generator sub-agent references this to produce skills that activate reliably and instruct clearly.

---

## Description Field Rules

The YAML frontmatter `description` field controls skill discovery and activation. Getting it wrong means the skill never triggers.

### Format Rules

1. **Single line only.** Multi-line descriptions silently break skill discovery (GitHub #9817/#4700).
2. **Maximum ~200 characters.** Longer descriptions get truncated in the `/` menu.
3. **Start with an action verb.** "Generates...", "Audits...", "Validates..."

### "When to Use" Framing

The description must tell Claude WHEN to load the skill, not just what it does.

**Good — trigger-specific:**
```yaml
description: Generates Claude Code skills from requirements using adaptive interview, complexity classification, and iterative validation. Use when creating new skills, scaffolding skill structure, or generating skills with sub-agent orchestration.
```

**Bad — vague:**
```yaml
description: A tool for creating skills.
```

**Bad — too broad:**
```yaml
description: Helps with skill development and management across projects.
```

### Pattern

```
{Action verb} {what it does} {using what method}. Use when {trigger condition 1}, {trigger condition 2}, or {trigger condition 3}.
```

The trigger conditions are the most important part. They determine whether Claude loads the skill when the user asks for something.

---

## Instruction Writing Patterns

How to write skill instructions that Claude actually follows.

### Binding Language

Without explicit binding language, Claude treats skill instructions as suggestions and skips steps it deems unnecessary.

**Pattern: Pre-Flight Gate**

Place a blocking gate before the main workflow. This forces acknowledgment before execution.

```markdown
## Pre-Flight Gate (BLOCKING)

**STOP. Before ANY analysis, you MUST acknowledge what this skill requires.**

### What You MUST Do
1. [Step 1]
2. [Step 2]

### What You MUST NOT Do
- Do NOT skip [specific step]
- Do NOT perform [agent's work] yourself
```

**Pattern: MANDATORY sections**

Mark critical steps explicitly:

```markdown
### Stage 2: Generate (MANDATORY)

You MUST spawn a Sonnet sub-agent for generation. Do NOT generate the output yourself.
```

**Pattern: Anti-thought traps**

Address the specific rationalization Claude uses to skip steps:

```markdown
If you find yourself thinking "I can do this faster without a sub-agent" — STOP.
That thought pattern violates the skill's instructions. The pipeline exists for bias avoidance.
```

### Good vs Bad Instructions

**Good — specific, actionable, ordered:**
```markdown
## Stage 1: Classify

1. Read the interview answers from Stage 0
2. Apply Decision A (Context Mode) using the decision tree in references/decision-framework.md
3. Apply Decision B (Sub-Agent Pattern)
4. Apply Decision C (Supporting Files)
5. Map the three decisions to a template using the Decision → Template Mapping table
6. Present classification to user via AskUserQuestion for confirmation
```

**Bad — vague, hand-wavy:**
```markdown
## Classification

Analyze the user's requirements and determine the best approach for the skill.
Consider factors like complexity, context needs, and file structure.
```

**Bad — too many options without guidance:**
```markdown
## Generation

You can either:
- Generate the skill directly
- Use a sub-agent
- Ask the user to provide more details
- Skip generation if the skill seems too complex

Choose the best approach based on the situation.
```

### Instruction Density

- Each stage should have 3-8 concrete steps
- Steps should be imperative: "Read X", "Write Y", "Spawn Z"
- Avoid conditional trees deeper than 2 levels (use a reference table instead)

---

## Common Pitfalls

Issues discovered through production usage of Claude Code skills.

### Pitfall 1: Multi-Line YAML Description

```yaml
# BROKEN — skill won't appear in / menu
description: >
  This skill does many things
  across multiple lines.

# CORRECT — single line
description: This skill does many things across multiple lines.
```

**Impact**: Silent failure. Skill exists on disk but never activates.

### Pitfall 2: Fork + Guidelines = No-Op

A skill with `context: fork` that contains only guidelines (no tool calls, no sub-agents) runs in an isolated context, reads the guidelines, and returns without doing anything useful. The forked context has no access to the user's conversation or files being discussed.

```yaml
# BROKEN — fork with only guidelines, no actionable work
context: fork
---
## Guidelines
- Write clean code
- Follow best practices
```

**Resolution**: Use inline (no fork) for guideline/knowledge skills. Fork is for skills that perform independent multi-step work.

### Pitfall 3: Over-Elaborate Output Specifications

Specifying every field, section, and format in exhaustive detail causes the generator to focus on format compliance rather than content quality.

**Better approach**: Provide a template file in `templates/` and reference it. Let the skill focus on WHAT to produce, not HOW to format every line.

### Pitfall 4: Missing Activation Triggers

A skill without clear trigger patterns in its description and "When to Use" section will never be loaded by Claude, regardless of how good its instructions are.

**Minimum viable activation**:
1. Description field with trigger verbs
2. "When to Use" section with trigger pattern table
3. "DO NOT use for" section to prevent false activations

### Pitfall 5: Sub-Agent Work Done by Orchestrator

When a skill specifies "spawn a sub-agent for X", Claude may skip spawning and do the work itself. This defeats bias separation and pipeline observability.

**Prevention**: Use the binding language patterns (Pre-Flight Gate, MUST/MUST NOT, anti-thought traps).

### Pitfall 6: Undocumented Dependencies

Skills that silently depend on other skills, scripts, or project structure break when used outside the original project.

**Prevention**: Declare all dependencies in a Dependencies table:

```markdown
## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Prompting** | `subagent-prompting` skill | REQUIRED | Before spawning any sub-agent |
| **Templates** | `templates/output.md` | REQUIRED | Include in sub-agent prompt |
```

---

## Activation Tuning

How to improve the chance Claude loads your skill when the user needs it.

### Trigger Verb Coverage

Include multiple trigger verbs in the description to catch different phrasings:

```yaml
# Covers: "create", "scaffold", "generate", "build"
description: Generates Claude Code skills from requirements... Use when creating new skills, scaffolding skill structure, or generating skills...
```

### "When to Use" Table

The table format is more reliable than prose for activation:

```markdown
| Trigger Pattern | Example User Request |
|-----------------|---------------------|
| Skill creation  | "Create a new skill", "Make a skill for X" |
| Scaffolding     | "Scaffold a skill", "Set up a new skill" |
| Generation      | "Generate a skill that does X" |
```

### "DO NOT Use For" Section

Negative triggers prevent false activations that waste tokens:

```markdown
**DO NOT use for:**
- Editing existing skills (edit directly)
- Debugging skill issues (use issue-debugging)
```

---

## Generate-and-Customize Contract

All generated skills are scaffolds, not production-ready output. This must be communicated explicitly.

### Required Disclaimer

Every generated skill should include this understanding in the post-generation summary:

```
This is a scaffold — a starting point for your skill. You should:
1. Review and customize the generated instructions
2. Test activation by asking Claude to invoke it
3. Iterate on trigger patterns until activation is reliable
4. Add domain-specific content to reference files
```

### Why This Matters

Research convergence across Rails generators, Yeoman, Create React App, and AI-era generators: output is always a starting point. Making this explicit prevents user disappointment and sets correct expectations.
