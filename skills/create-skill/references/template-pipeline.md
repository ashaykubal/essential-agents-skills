# Template: Pipeline Skill

Use this template when the skill orchestrates multiple distinct operations using sub-agents. Typical for review pipelines, audit workflows, and multi-stage analysis.

**When to use**: Decision B = sequential or parallel Task tool sub-agents.

---

## File Structure

Pipeline skills generate both an orchestrating skill AND dedicated sub-agent files:

```
skills/{skill-name}/
├── SKILL.md                              (orchestrating skill)
├── references/
│   ├── {stage-specific-reference-1}.md
│   └── {stage-specific-reference-N}.md
└── templates/
    ├── {output-template}.md
    └── diagnostic-output.yaml

.claude/agents/
├── {skill-name}-{stage1-name}.md         (sub-agent for stage 1)
├── {skill-name}-{stage2-name}.md         (sub-agent for stage 2)
└── {skill-name}-{stageN-name}.md         (sub-agent for stage N)
```

**Why dedicated sub-agent files**: Sub-agents defined in `.claude/agents/*.md` have deterministic behavior locked into their system prompts — consistent across invocations. Inline sub-agent definitions in skill references produce variable behavior because the orchestrator interprets the reference content differently per run.

**Naming convention**: Sub-agent files are prefixed with the skill name to avoid collisions (e.g., `code-review-security-reviewer.md`, `code-review-type-safety-reviewer.md`).

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
| **Sub-agents** | `.claude/agents/{skill-name}-{stage}.md` | **REQUIRED** | Invoked via Task tool per stage |

---

## Usage

```
/{skill-name} {arguments} [flags]
```

---

## Pre-Flight Gate (BLOCKING)

**STOP. Before ANY work, you MUST acknowledge what this skill requires.**

This skill uses a **multi-stage pipeline with dedicated sub-agents**. You are the orchestrator, NOT the executor.

### What You MUST Do

1. Load all required dependencies
2. Execute stages in order (or parallel where specified)
3. Spawn dedicated sub-agents for each stage via Task tool — do NOT perform their work yourself
4. Write intermediate stage outputs to `$PROJECT_DIR/logs/`
5. Write final deliverables (synthesis, reports) to `$PROJECT_DIR/artifacts/`
6. Write diagnostic YAML to `$PROJECT_DIR/logs/diagnostics/`

### What You MUST NOT Do

- Do NOT skip stages
- Do NOT perform sub-agent work yourself
- Do NOT return to user until all log files are written
- Do NOT spawn sub-agents with run_in_background: true (SA5)

---

## Pipeline

```fsharp
// {skill-name} pipeline
Stage0_PreFlight(args)
|> Stage1_{Name}(input)        // {skill-name}-{stage1} sub-agent — {purpose}
|> Stage2_{Name}(stage1_output) // {skill-name}-{stage2} sub-agent — {purpose}
|> Stage3_{Name}(stage2_output) // {skill-name}-{stage3} sub-agent — {purpose}
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

### Stage 1: {Name} (Dedicated sub-agent)

```
Construct prompt using 4-part template:
├── GOAL: {what this stage achieves}
├── CONSTRAINTS: {boundaries}
├── CONTEXT: {input data, reference files to read}
└── OUTPUT: Write to $PROJECT_DIR/logs/{skill-name}/{stage1-name}-{timestamp}.{ext}

Spawn: Task(subagent_type="{skill-name}-{stage1-name}", prompt=...)
Read output from $PROJECT_DIR/logs/{skill-name}/
```

### Stage 2: {Name} (Dedicated sub-agent)

{Same structure as Stage 1, reading Stage 1 output as input.}

### Stage N: Diagnostics (REQUIRED)

Write to `$PROJECT_DIR/logs/diagnostics/{skill-name}-{YYYYMMDD-HHMMSS}.yaml`

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
- [ ] Intermediate stage outputs written to `$PROJECT_DIR/logs/{skill-name}/`
- [ ] Final deliverables written to `$PROJECT_DIR/artifacts/{skill-name}/{slug}/`
- [ ] Diagnostic YAML written to `$PROJECT_DIR/logs/diagnostics/`
- [ ] Results presented to user
```

## Generated Sub-Agent Structure

Each pipeline stage gets a dedicated agent file at `.claude/agents/{skill-name}-{stage-name}.md`. Use the `references/agent-template.md` structure and follow `references/agent-conventions.md` conventions.

Key requirements for generated sub-agents:

- **System-prompt register**: The agent body defines WHO the agent IS, not step-by-step instructions
- **Identity reflects stage role**: "You are a security reviewer" not "You are Stage 2"
- **Single-purpose**: Each sub-agent does one thing well
- **SA2 compliant**: All intermediate output goes to `$PROJECT_DIR/logs/`, deliverables to `$PROJECT_DIR/artifacts/`
- **Permissions Setup section**: Documents required tool permissions
- **150-250 lines each**: Keep sub-agents focused

### Sub-Agent Naming

```
{skill-name}-{stage-role}.md
```

Examples:
- `code-review-security-reviewer.md`
- `code-review-type-safety-reviewer.md`
- `test-audit-classifier.md`
- `test-audit-deep-analyzer.md`

### Sub-Agent Model Selection

| Stage Purpose | Model | Rationale |
|---------------|-------|-----------|
| Quick lookups, classification | haiku | Fast, low-cost |
| Analysis, review, research | sonnet | Balanced capability |
| Implementation, architecture | opus | Highest quality |

Default to **Sonnet** for most pipeline stages.

## Guidance for Generator

- Generate BOTH the orchestrating SKILL.md AND the sub-agent `.md` files
- The orchestrating skill references sub-agents by `Task(subagent_type="{name}")`, not inline definitions
- Every sub-agent stage needs a 4-part prompt (GOAL/CONSTRAINTS/CONTEXT/OUTPUT) in the orchestrating skill
- Include the `subagent-prompting` skill in the orchestrating skill's frontmatter `skills:` dependency
- Use the Pre-Flight Gate pattern — without it, Claude skips sub-agent spawning
- Model selection per stage: Haiku for lookups, Sonnet for analysis, Opus for writing
- Each stage writes to `$PROJECT_DIR/logs/{skill-name}/` — the next stage reads from there (log-based handoff between stages)
- Final deliverables (synthesis, reports) go to `$PROJECT_DIR/artifacts/{skill-name}/{slug}/` — NOT to `logs/`
- **IMPORTANT**: `$PROJECT_DIR` is the project root (where `.claude/` lives). All paths MUST use this prefix. Do NOT write to the skill directory, CWD, or `.claude/skills/`.
- Include F# pipeline notation for visual workflow documentation
- Orchestrating skill is typically 200-400 lines
- Each sub-agent is typically 150-250 lines
- Read `references/agent-template.md` for the sub-agent file structure
- Read `references/agent-conventions.md` for system-prompt register and frontmatter conventions
