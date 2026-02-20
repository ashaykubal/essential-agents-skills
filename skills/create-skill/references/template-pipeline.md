# Template: Pipeline Skill

Use this template when the skill orchestrates multiple distinct operations using sub-agents. Typical for review pipelines, audit workflows, and multi-stage analysis.

**When to use**: Decision B = sequential or parallel Task tool sub-agents.

---

## File Structure

```
skills/{skill-name}/
├── SKILL.md
├── references/
│   ├── {stage-specific-reference-1}.md
│   └── {stage-specific-reference-N}.md
└── templates/
    ├── {output-template}.md
    └── diagnostic-output.yaml
```

## Generated SKILL.md Structure

```markdown
---
name: {skill-name}
description: {single-line, trigger-specific, "Use when..." framing}
user-invocable: true
skills:
  - subagent-prompting
---

# {Skill Title}

{One-paragraph summary describing the pipeline and its purpose.}

---

## When to Use This Skill

{Trigger pattern table + DO NOT use for section.}

---

## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Stage references** | `references/{name}.md` | **REQUIRED** | Load before spawning stage agent |
| **Output templates** | `templates/{name}.md` | **REQUIRED** | Include in sub-agent prompt |
| **Diagnostics** | `templates/diagnostic-output.yaml` | **REQUIRED** | Write at pipeline completion |
| **Prompting** | `subagent-prompting` skill | **REQUIRED** | Load before spawning any sub-agent |

---

## Usage

```
/{skill-name} {arguments} [flags]
```

---

## Pre-Flight Gate (BLOCKING)

**STOP. Before ANY work, you MUST acknowledge what this skill requires.**

This skill uses a **multi-stage pipeline with sub-agents**. You are the orchestrator, NOT the executor.

### What You MUST Do

1. Load all required dependencies
2. Execute stages in order (or parallel where specified)
3. Spawn sub-agents for each stage — do NOT perform their work yourself
4. Write all outputs to `logs/`
5. Write diagnostic YAML at completion

### What You MUST NOT Do

- Do NOT skip stages
- Do NOT perform sub-agent work yourself
- Do NOT return to user until all log files are written

---

## Pipeline

```fsharp
// {skill-name} pipeline
Stage0_PreFlight(args)
|> Stage1_{Name}(input)        // {Model} sub-agent — {purpose}
|> Stage2_{Name}(stage1_output) // {Model} sub-agent — {purpose}
|> Stage3_{Name}(stage2_output) // {Model} sub-agent — {purpose}
|> Diagnostics(all_outputs)
```

---

## Stage Definitions

### Stage 0: Pre-Flight (Orchestrator)

```
Stage 0: Pre-Flight
├── Parse arguments
├── Load dependencies
├── Validate inputs exist
└── Token budget check
```

### Stage 1: {Name} ({Model} sub-agent)

```
Construct prompt using 4-part template:
├── GOAL: {what this stage achieves}
├── CONSTRAINTS: {boundaries}
├── CONTEXT: {input data, reference files to read}
└── OUTPUT: Write to logs/{skill-name}-stage1-{timestamp}.{ext}

Spawn: Task(subagent_type="general-purpose", model="{model}", prompt=...)
Read output from logs/
```

### Stage 2: {Name} ({Model} sub-agent)

{Same structure as Stage 1, reading Stage 1 output as input.}

### Stage N: Diagnostics (REQUIRED)

Write to `logs/diagnostics/{skill-name}-{YYYYMMDD-HHMMSS}.yaml`

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Sub-agent returns empty output | Re-spawn once. If still empty, STOP with error. |
| Stage fails validation | {retry/abort/skip with warning} |
| Token budget exceeded | Stop, present partial output with explanation. |

---

## Completion Checklist

- [ ] All stages executed
- [ ] All log files written to `logs/`
- [ ] Diagnostic YAML written
- [ ] Results presented to user
```

## Guidance for Generator

- Every sub-agent stage needs a 4-part prompt (GOAL/CONSTRAINTS/CONTEXT/OUTPUT)
- Include the `subagent-prompting` skill in frontmatter `skills:` dependency
- Use the Pre-Flight Gate pattern — without it, Claude skips sub-agent spawning
- Model selection per stage: Haiku for lookups, Sonnet for analysis, Opus for writing
- Each stage writes to `logs/` — the next stage reads from there (log-based handoff between stages)
- Include F# pipeline notation for visual workflow documentation
- Pipeline skills are typically 200-400 lines
