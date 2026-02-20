# Template: Simple Skill

Use this template when the skill is a vanilla SKILL.md with no supporting files. Typical for guideline skills, knowledge layers, and single-purpose utilities.

**When to use**: Decision C = no references, no templates, no scripts.

---

## File Structure

```
skills/{skill-name}/
└── SKILL.md
```

## Generated SKILL.md Structure

```markdown
---
name: {skill-name}
description: {single-line, trigger-specific, "Use when..." framing}
user-invocable: {true/false}
---

# {Skill Title}

{One-paragraph summary of what this skill does and why it exists.}

---

## When to Use This Skill

**Load this skill when the user request matches ANY of these patterns:**

| Trigger Pattern | Example User Request |
|-----------------|---------------------|
| {pattern-1} | "{example request 1}" |
| {pattern-2} | "{example request 2}" |
| {pattern-3} | "{example request 3}" |

**DO NOT use for:**
- {anti-trigger 1} (use {alternative} instead)
- {anti-trigger 2}

---

## Usage

{If user-invocable: invocation syntax and arguments.}
{If not user-invocable: how consuming skills/agents reference this.}

---

## Instructions

{Core skill content. For simple skills this is the main body:
guidelines, rules, patterns, or knowledge that Claude should apply.}

{Use numbered steps for procedural skills.}
{Use tables for rule-based skills.}
{Use sections for knowledge skills.}

---

## Completion Checklist

Before returning to the user, verify:

- [ ] {Outcome 1 achieved}
- [ ] {Outcome 2 achieved}
- [ ] {No unintended side effects}
```

## Guidance for Generator

- Keep the skill under 150 lines for simple skills
- The Instructions section is the heart — make it specific and actionable
- Do NOT add references/ or templates/ directories — this is a vanilla skill
- Do NOT add diagnostic output unless the skill performs multi-step work
- If the skill is `user-invocable: false`, it's consumed by other skills — describe the consumer interface
