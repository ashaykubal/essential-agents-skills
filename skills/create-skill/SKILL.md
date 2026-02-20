---
name: create-skill
description: Generates Claude Code skills from requirements using adaptive interview, complexity classification, and iterative validation. Use when creating new skills, scaffolding skill structure, or generating skills with sub-agent orchestration.
user-invocable: true
argument-hint: "<description-or-name> [--doc <requirements-path>]"
skills:
  - subagent-prompting
---

# Create Skill

Generates a complete Claude Code skill from a description or requirements document. Conducts an adaptive interview to understand the skill's purpose, classifies it into one of 5 structural types, spawns a Sonnet sub-agent to generate the files, validates with anthropic-validator, and presents the scaffold with architectural decisions.

---

## When to Use This Skill

**Load this skill when the user request matches ANY of these patterns:**

| Trigger Pattern | Example User Request |
|-----------------|---------------------|
| Skill creation | "Create a new skill", "Make a skill for X" |
| Scaffolding | "Scaffold a skill", "Set up a new skill" |
| Generation | "Generate a skill that does X" |
| Skill design | "Design a skill for X", "I need a skill that does X" |

**DO NOT use for:**
- Editing existing skills (edit directly)
- Creating agents (use `create-agent`)
- Debugging skill issues (use `issue-debugging`)
- Validating existing skills (use `anthropic-validator`)

---

## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Decision framework** | `references/decision-framework.md` | **REQUIRED** | Load at Stage 0 for interview + classification |
| **Content guidance** | `references/content-guidance.md` | **REQUIRED** | Include in Stage 2 generator prompt |
| **Skill templates** | `references/template-*.md` | **REQUIRED** | Load the matching template at Stage 2 |
| **Diagnostic template** | `templates/diagnostic-output.yaml` | **REQUIRED** | Use at Stage 6 |
| **Subagent prompting** | `subagent-prompting` skill | **REQUIRED** | Load at Stage 0 for 4-part prompt template |

**Fallback behavior:**
- If a template file is missing: Use the closest available template, note mismatch in diagnostics
- If content-guidance is missing: Proceed without it, note in diagnostics (output quality will be lower)

---

## Usage

```
/create-skill <description-or-name>
/create-skill --doc <requirements-document>
```

**Arguments:**
- `<description-or-name>` — Free-text description of the desired skill, or a skill name to start from
- `--doc <path>` — Path to a requirements document. Extracts interview answers from it instead of asking fresh.

**Examples:**
- `/create-skill a skill that audits dependency versions` — Start from description
- `/create-skill --doc plans/task-briefs/P5.4-create-skill.md` — Start from requirements doc
- `/create-skill changelog-generator` — Start from a name

---

## Pre-Flight Gate (BLOCKING)

**STOP. Before ANY work, you MUST acknowledge what this skill requires.**

This skill uses a **6-stage pipeline with sub-agents**. You are the orchestrator, NOT the generator.

### What You MUST Do

1. Conduct an adaptive interview (Stage 0)
2. Classify the skill using three independent decisions (Stage 1)
3. Present classification to user for confirmation
4. Spawn a Sonnet sub-agent to generate the skill files (Stage 2)
5. Run anthropic-validator on the generated output (Stage 3)
6. If validation fails, spawn a Sonnet sub-agent to fix issues (Stage 4, max 2 retries)
7. Present the scaffold with architectural decisions (Stage 5)
8. Write diagnostic YAML (Stage 6)

### What You MUST NOT Do

- **Do NOT generate the skill files yourself** — spawn a sub-agent (Stage 2)
- **Do NOT skip the interview** — it determines the classification
- **Do NOT skip validation** — anthropic-validator catches structural issues
- **Do NOT skip the post-generation summary** — users need to know what was decided and why

If you find yourself thinking "I can generate this directly without a sub-agent" — STOP. The sub-agent reads templates and content guidance that produce structurally correct output. The pipeline exists for consistency, not speed.

---

## Pipeline

```fsharp
// create-skill pipeline
PreFlight(args)                              // Stage 0: Orchestrator — parse input, adaptive interview
|> Classify(interview_answers)               // Stage 1: Orchestrator — three independent decisions
|> Generate(classification, template, examples) // Stage 2: Sonnet sub-agent — produce skill files
|> Validate(generated_output)                // Stage 3: Orchestrator — run anthropic-validator
|> Refine(validator_findings)                // Stage 4: Sonnet sub-agent (conditional, max 2 retries)
|> Present(final_output, decisions_summary)  // Stage 5: Orchestrator — scaffold + post-generation summary
|> Diagnostics()                             // Stage 6: Orchestrator — write YAML
```

---

## Stage Definitions

### Stage 0: Pre-Flight (Orchestrator)

```
Stage 0: Pre-Flight
├── Parse arguments (description, name, or --doc path)
├── Load references/decision-framework.md
├── Load references/content-guidance.md
├── Load subagent-prompting skill
├── If --doc provided:
│   ├── Read the requirements document
│   ├── Extract answers to Q1-Q5 from the document
│   └── Present extracted answers to user for confirmation via AskUserQuestion
├── If no --doc:
│   └── AskUserQuestion: Present all 5 core questions from decision-framework.md
│       ├── Q1: What does this skill do? (concrete invocation examples)
│       ├── Q2: Needs conversation history, or can run in isolation?
│       ├── Q3: Orchestrates multiple distinct operations?
│       ├── Q4: How much domain-specific reference content? (None/Some/Extensive)
│       └── Q5: Produces structured output matching a specific format?
├── If complexity detected in answers:
│   └── AskUserQuestion: Follow-up questions per decision-framework.md
│       ├── Q6: Do operations depend on each other's output?
│       ├── Q7: Do workers need direct communication?
│       ├── Q8: Error handling between stages?
│       └── Q9-Q10: Context-specific follow-ups
├── Determine target directory for generated skill
│   └── Default: skills/{skill-name}/ (or user-specified path)
└── Token budget check (warn if >30% consumed)
```

**Interview behavior**: Maximum 2 AskUserQuestion rounds. Present Q1-Q5 together in round 1. Follow-ups (if needed) in round 2. Do NOT ask questions one at a time.

### Stage 1: Classify (Orchestrator)

Apply the three-decision classification from `references/decision-framework.md`:

```
Stage 1: Classify
├── Decision A: Context Mode
│   ├── Needs conversation history → inline (no fork)
│   ├── Isolated multi-step work → context: fork
│   └── Simple guideline/knowledge → inline (warn if fork requested)
├── Decision B: Sub-Agent Pattern
│   ├── Single operation → no sub-agents
│   ├── Multiple dependent operations → sequential Task tool
│   ├── Multiple independent operations → parallel Task tool
│   └── Direct worker communication → Agent Teams (experimental warning)
├── Decision C: Supporting Files
│   ├── No references, no templates → vanilla SKILL.md
│   ├── Domain references needed → add references/
│   ├── Structured output format → add templates/
│   └── Deterministic code needed → add scripts/
├── Map decisions → template (1 of 5 from decision-framework.md)
└── Present classification to user via AskUserQuestion:
    ├── "Context: {inline/fork} — {reason}"
    ├── "Sub-agents: {none/sequential/parallel/AT} — {reason}"
    ├── "Supporting files: {list} — {reason}"
    ├── "Template: {template name}"
    └── "Proceed with generation? [Yes / Adjust]"
```

**MANDATORY**: Wait for user confirmation before proceeding to Stage 2. If user selects "Adjust", re-classify with their feedback.

### Stage 2: Generate (Sonnet sub-agent)

```
Stage 2: Generate
├── Read the selected template from references/template-{type}.md
├── Construct prompt using 4-part template (GOAL/CONSTRAINTS/CONTEXT/OUTPUT):
│   ├── GOAL: Generate a complete, structurally correct skill matching the
│   │   classification. The skill must activate reliably and instruct clearly.
│   ├── CONSTRAINTS:
│   │   ├── Follow the template structure exactly
│   │   ├── Description MUST be a single line (multi-line breaks discovery)
│   │   ├── Description MUST use "Use when..." trigger framing
│   │   ├── Include "When to Use" table with ≥3 trigger patterns
│   │   ├── Include "DO NOT use for" section with ≥2 anti-triggers
│   │   ├── If skill has sub-agents: include Pre-Flight Gate with MUST/MUST NOT
│   │   ├── If skill has sub-agents: include subagent-prompting in skills: dependency
│   │   ├── Do NOT add unnecessary files (no README, CHANGELOG, LICENSE)
│   │   ├── Do NOT use emojis in generated content
│   │   └── Keep total SKILL.md under target line count for the type
│   │       (simple: 150, reference-heavy: 200, pipeline: 400, script: 400, research: 400)
│   ├── CONTEXT:
│   │   ├── Classification from Stage 1 (all three decisions + template)
│   │   ├── User's interview answers (concrete examples from Q1)
│   │   ├── Selected template: references/template-{type}.md
│   │   ├── Content guidance: references/content-guidance.md
│   │   ├── Instruction: "Read 1-2 existing skills of the same type from the
│   │   │   codebase for structural reference (use Glob to find skills/*/SKILL.md)"
│   │   └── Target output directory
│   └── OUTPUT:
│       ├── Write SKILL.md to {target-directory}/SKILL.md
│       ├── Write reference files to {target-directory}/references/ (if applicable)
│       ├── Write template files to {target-directory}/templates/ (if applicable)
│       ├── Write script files to {target-directory}/scripts/ (if applicable)
│       └── Return summary: list of files created with line counts
├── Spawn: Task(description="Generate skill files", subagent_type="general-purpose",
│          model="sonnet", prompt=...)
├── Read generator output (file list + summary)
└── Verify files were created (Glob for {target-directory}/**)
```

### Stage 3: Validate (Orchestrator)

```
Stage 3: Validate
├── Invoke /anthropic-validator on the generated skill directory
│   └── (Load the anthropic-validator skill and follow its workflow against {target-directory}/)
├── Read validator output
├── Check for critical/high findings:
│   ├── 0 critical AND 0 high → proceed to Stage 5 (skip Stage 4)
│   └── Any critical or high → proceed to Stage 4 (refine)
├── Check description is single-line (read SKILL.md, verify no multiline description)
└── Check no unnecessary files (no README.md, CHANGELOG.md, etc.)
```

### Stage 4: Refine (Sonnet sub-agent, conditional, max 2 retries)

This stage only runs if Stage 3 found critical or high issues.

```
Stage 4: Refine (attempt {N} of 2)
├── Construct prompt using 4-part template:
│   ├── GOAL: Fix all critical and high findings from anthropic-validator
│   ├── CONSTRAINTS:
│   │   ├── Only fix the specific issues identified — do not restructure
│   │   ├── Preserve the existing skill content and structure
│   │   └── Description must remain single-line
│   ├── CONTEXT:
│   │   ├── Validator findings (critical and high items with descriptions)
│   │   ├── Current generated files (read from target directory)
│   │   └── Content guidance: references/content-guidance.md
│   └── OUTPUT: Edit files in {target-directory}/ to fix findings
├── Spawn: Task(description="Fix validator findings", subagent_type="general-purpose",
│          model="sonnet", prompt=...)
├── Re-run Stage 3 (validate)
├── If still failing after 2 retries:
│   └── Proceed to Stage 5 with caveats noted
└── Token budget check
```

### Stage 5: Present (Orchestrator)

```
Stage 5: Present
├── Read all generated files for summary
├── Present to user:
│   ├── "Generated skill at: {target-directory}/"
│   ├── "Files created:"
│   │   └── List each file with line count
│   ├── "Architectural decisions:"
│   │   ├── "Context: {fork/inline} — {reason}"
│   │   ├── "Sub-agents: {none/sequential/parallel/AT} — {reason}"
│   │   └── "Supporting files: {list} — {reason}"
│   ├── "Skill type: {template used}"
│   ├── "Validation: {pass/fail with details}"
│   ├── If caveats: "Unresolved issues: {list}"
│   └── "Next steps:"
│       ├── "1. Review and customize the generated instructions"
│       ├── "2. Test activation by asking Claude to invoke it"
│       ├── "3. Iterate on trigger patterns until activation is reliable"
│       └── "4. Add domain-specific content to reference files"
└── Note: This is a scaffold, not production-ready output (generate-and-customize contract)
```

### Stage 6: Diagnostics (REQUIRED)

**MANDATORY**: Write diagnostic output after every invocation. This cannot be skipped.

```
Stage 6: Diagnostics
├── Write to: logs/diagnostics/create-skill-{YYYYMMDD-HHMMSS}.yaml
│   └── Use templates/diagnostic-output.yaml schema
└── Include:
    ├── Input: description/name/doc path
    ├── Interview: questions asked, rounds completed
    ├── Classification: all three decisions + template selected
    ├── Generation: files created, line counts, model used
    ├── Validation: pass/fail, findings count, retry count
    └── Outcome: success/partial/failure
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Generator sub-agent returns empty output | Re-spawn once with reinforced instructions. If still empty, STOP: "Generation failed. Please try with a more detailed description." |
| anthropic-validator finds critical issues | Stage 4 retry (max 2). After 2 retries, present with caveats. |
| anthropic-validator unavailable | Skip validation, note in diagnostics, warn user: "Validation skipped — run /anthropic-validator manually." |
| Interview answers are ambiguous | Ask 1-2 follow-up questions (max 2 AskUserQuestion rounds total). |
| User requests Agent Teams | Include experimental warning: "Agent Teams requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1. This is an experimental feature." |
| Token budget exceeded | Stop at current stage, present partial output with explanation. |
| Target directory already exists | AskUserQuestion: "Directory {path} already exists. Overwrite / Choose different name / Cancel?" |
| User rejects classification | Re-classify with user's feedback. Max 2 classification rounds. |

---

## Token Budget Management

| Checkpoint | Threshold | Action |
|------------|-----------|--------|
| After Pre-Flight | >30% consumed | Warn: "Pipeline agents will consume significant context." |
| After Generate | >55% consumed | Warn: "Approaching budget. Validation + refinement may be limited." |
| After Validate | >65% consumed | Skip refinement if needed, present as-is with caveats. |

---

## Completion Checklist

**IMPORTANT**: Before returning to the user, verify ALL items are complete:

- [ ] Stage 0: Arguments parsed (description, name, or --doc)
- [ ] Stage 0: Decision framework and content guidance loaded
- [ ] Stage 0: Adaptive interview conducted (1-2 rounds)
- [ ] Stage 1: Three decisions made (context, sub-agents, supporting files)
- [ ] Stage 1: Classification presented to user and confirmed
- [ ] Stage 2: Sonnet sub-agent spawned for generation
- [ ] Stage 2: Generated files verified to exist
- [ ] Stage 3: anthropic-validator run on generated skill
- [ ] Stage 4: Refinement attempted if validation found critical/high issues
- [ ] Stage 5: Post-generation summary presented with architectural decisions
- [ ] Stage 5: Next steps communicated (scaffold, not production-ready)
- [ ] Stage 6: Diagnostic YAML written to `logs/diagnostics/`

**Do NOT return to user until all applicable checkboxes can be marked complete.**
