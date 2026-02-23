# Template: Script-Driven Skill

Use this template when the skill requires deterministic code execution (AST analysis, data transforms, file processing) alongside LLM stages. Typical for analysis tools that combine static tooling with LLM judgment.

**When to use**: Decision C = scripts needed for deterministic execution.

---

## File Structure

```
skills/{skill-name}/
├── SKILL.md
├── scripts/
│   ├── {script-1}.ts (or .sh, .py)
│   └── {script-N}.ts
└── references/
    ├── {reference-1}.md
    └── {reference-N}.md
```

## Generated SKILL.md Structure

```markdown
---
name: {skill-name}
description: {single-line, trigger-specific, "Use when..." framing}
user-invocable: true
skills:
  - subagent-prompting  # If sub-agents used
---

# {Skill Title}

{One-paragraph summary. Mention both deterministic (script) and LLM stages.}

---

## When to Use This Skill

{Trigger pattern table + DO NOT use for section.}

---

## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Scripts** | `scripts/{name}.ts` | **REQUIRED** | Run at Stage 0 before LLM stages |
| **References** | `references/{name}.md` | **REQUIRED** | Load for LLM stage context |

**Script execution**: Scripts run via the project task runner (e.g., `just {recipe-name} {args}`). Do NOT run scripts via `npx` or `node` directly unless no task runner recipe exists.

---

## Usage

```
/{skill-name} {arguments} [flags]
```

---

## Pre-Flight Gate (BLOCKING)

**STOP. Scripts MUST run before any LLM analysis.**

### What You MUST Do

1. Run all required scripts first — they produce deterministic metadata
2. Read script output before proceeding to LLM stages
3. LLM stages consume script output as structured input

### What You MUST NOT Do

- Do NOT skip script execution
- Do NOT substitute LLM judgment for script output
- Do NOT proceed to LLM stages if scripts fail

---

## Pipeline

```fsharp
// {skill-name} pipeline
Stage0_Scripts(args)           // Deterministic — run scripts via task runner
|> Stage1_{Name}(script_data)  // LLM stage — {purpose}
|> Stage2_{Name}(stage1_output) // LLM stage — {purpose}
|> Diagnostics(all_outputs)
```

---

## Stage Definitions

### Stage 0: Script Execution (Deterministic)

Run scripts and capture output:

```
Scripts:
├── `just {recipe-1} {target}` → {output-path-1}
├── `just {recipe-2} {target}` → {output-path-2}
└── Read all script outputs before proceeding
```

**Script output format**: Scripts produce JSON or YAML to a known path. The orchestrator reads this structured data and passes it to LLM stages.

### Stage 1: {Name} (LLM Stage)

{LLM analysis that consumes script output as structured input.}

### Stage N: Diagnostics (REQUIRED)

Write to `$PROJECT_DIR/logs/diagnostics/{skill-name}-{YYYYMMDD-HHMMSS}.yaml`

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Script fails to execute | Check: Is the script executable? Is the task runner recipe defined? Report error and STOP. |
| Script produces empty output | Report: "Script {name} produced no output for {target}." STOP. |
| Script output malformed | Report the parse error. Do NOT proceed with LLM stages on bad data. |

---

## Completion Checklist

- [ ] All scripts executed successfully
- [ ] Script output consumed by LLM stages
- [ ] All log files written
- [ ] Diagnostic YAML written
- [ ] Results presented to user
```

## Generated Script Structure

Scripts should be self-contained and produce structured output:

```typescript
// scripts/{name}.ts
// Purpose: {what this script does}
// Input: {command-line args}
// Output: {JSON/YAML to stdout or file}

import { /* minimal deps */ } from '...';

// Parse args
const target = process.argv[2];
if (!target) {
  console.error('Usage: {script-name} <target>');
  process.exit(1);
}

// Process
const result = analyze(target);

// Output structured data
console.log(JSON.stringify(result, null, 2));
```

## Guidance for Generator

- Scripts must be self-contained — no imports from project-specific modules
- Scripts produce structured output (JSON/YAML) that LLM stages consume
- The task runner recipe is the execution interface — scripts are not invoked directly
- Stage 0 (scripts) must complete before any LLM stages start
- If the skill needs a Justfile recipe, include it in the post-generation summary as a manual setup step
- Script-driven skills are the most complex type — expect 200-400 lines for SKILL.md plus script files
- Consider whether a simpler approach (LLM-only) would work before committing to scripts
