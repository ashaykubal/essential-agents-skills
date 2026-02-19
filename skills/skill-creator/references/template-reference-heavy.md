# Template: Reference-Heavy Skill

Use this template when the skill needs domain-specific reference content that would bloat SKILL.md if inlined. Typical for data-driven skills, pattern libraries, and knowledge bases.

**When to use**: Decision C = references needed, no sub-agents.

---

## File Structure

```
skills/{skill-name}/
├── SKILL.md
└── references/
    ├── {domain-1}.md
    ├── {domain-2}.md
    └── {domain-N}.md
```

## Generated SKILL.md Structure

```markdown
---
name: {skill-name}
description: {single-line, trigger-specific, "Use when..." framing}
user-invocable: {true/false}
---

# {Skill Title}

{One-paragraph summary.}

---

## When to Use This Skill

{Trigger pattern table + DO NOT use for section.}

---

## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **{Category 1}** | `references/{domain-1}.md` | **REQUIRED** | {loading condition} |
| **{Category 2}** | `references/{domain-2}.md` | **REQUIRED** | {loading condition} |

**Fallback behavior:**
- If a reference file is missing: {what to do — note in log, continue with available data, or stop}

---

## Usage

{Invocation syntax, arguments, flags.}

---

## Workflow

{Step-by-step instructions referencing the loaded reference files.}

### Step 1: Load References

Read the applicable reference files from the Dependencies table.

### Step 2: {Core Operation}

{Apply the reference data to the user's request.}

### Step 3: {Output}

{Present results to the user.}

---

## Completion Checklist

- [ ] All required reference files loaded
- [ ] {Domain-specific outcome achieved}
- [ ] {Output matches expected format}
```

## Generated Reference File Structure

Each reference file in `references/` should follow this pattern:

```markdown
# {Domain Name}

{Brief description of what this reference contains and when to use it.}

---

## {Section 1}

{Content organized by how it will be consumed — tables for lookup,
lists for iteration, prose for context.}

## {Section 2}

{Additional content sections as needed.}
```

## Guidance for Generator

- Reference files should be 50-150 lines each — enough to be useful, not so much they consume token budget
- The SKILL.md should NOT duplicate reference content — it should instruct WHEN and HOW to load it
- Reference files are the domain knowledge; SKILL.md is the workflow
- Name reference files by domain concept, not by step number (e.g., `security-patterns.md` not `step-2-data.md`)
- Include a Dependencies table in SKILL.md — this is how consumers know what to load
