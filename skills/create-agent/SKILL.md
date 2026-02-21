---
name: create-agent
description: Generates Claude Code agents from requirements using adaptive interview, architecture classification, and iterative validation. Use when creating new agents, generating agent definitions with hooks and diagnostics, or scaffolding multi-agent systems.
user-invocable: true
argument-hint: "<description-or-name> [--doc <requirements-path>]"
skills:
  - subagent-prompting
---

# Create Agent

Generates a complete Claude Code agent from a description or requirements document. Conducts an adaptive interview to understand the agent's identity and mission, classifies it into one of 3 architecture types, spawns a Sonnet sub-agent to generate the agent file, validates with anthropic-validator, and presents the scaffold with architectural decisions.

---

## When to Use This Skill

**Load this skill when the user request matches ANY of these patterns:**

| Trigger Pattern | Example User Request |
|-----------------|---------------------|
| Agent creation | "Create a new agent", "Make an agent for X" |
| Agent scaffolding | "Scaffold an agent", "Set up a new agent" |
| Agent generation | "Generate an agent that does X" |
| Agent design | "Design an agent for X", "I need an agent that does X" |
| Sub-agent creation | "Create a dedicated agent for this sub-agent role" |

**DO NOT use for:**
- Creating skills (use `create-skill`)
- Editing existing agents (edit directly)
- Debugging agent issues (use `issue-debugging`)
- Validating existing agents (use `anthropic-validator`)

---

## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Decision framework** | `references/decision-framework.md` | **REQUIRED** | Load at Stage 0 for interview + classification |
| **Agent conventions** | `references/agent-conventions.md` | **REQUIRED** | Include in Stage 2 generator prompt |
| **Content guidance** | `references/content-guidance.md` | **REQUIRED** | Include in Stage 2 generator prompt |
| **Agent templates** | `references/template-*.md` | **REQUIRED** | Load the matching template at Stage 2 |
| **Diagnostic template** | `templates/diagnostic-output.yaml` | **REQUIRED** | Use at Stage 6 |
| **Subagent prompting** | `subagent-prompting` skill | **REQUIRED** | Load at Stage 0 for 4-part prompt template |

**Fallback behavior:**
- If a template file is missing: Use the closest available template, note mismatch in diagnostics
- If content-guidance is missing: Proceed without it, note in diagnostics (output quality will be lower)

---

## Usage

```
/create-agent <description-or-name>
/create-agent --doc <requirements-document>
```

**Arguments:**
- `<description-or-name>` — Free-text description of the desired agent, or an agent name to start from
- `--doc <path>` — Path to a requirements document. Extracts interview answers from it instead of asking fresh.

**Examples:**
- `/create-agent a code security reviewer that checks for OWASP vulnerabilities` — Start from description
- `/create-agent --doc plans/task-briefs/P4.4-implementer.md` — Start from requirements doc
- `/create-agent market-analyst` — Start from a name

---

## Pre-Flight Gate (BLOCKING)

**STOP. Before ANY work, you MUST acknowledge what this skill requires.**

This skill uses a **6-stage pipeline with sub-agents**. You are the orchestrator, NOT the generator.

### What You MUST Do

1. Conduct an adaptive interview (Stage 0)
2. Classify the agent using three independent decisions (Stage 1)
3. Present classification to user for confirmation
4. Spawn a Sonnet sub-agent to generate the agent file (Stage 2)
5. Run anthropic-validator on the generated output (Stage 3)
6. If validation fails, spawn a Sonnet sub-agent to fix issues (Stage 4, max 2 retries)
7. Present the scaffold with architectural decisions (Stage 5)
8. Write diagnostic YAML (Stage 6)

### What You MUST NOT Do

- **Do NOT generate the agent file yourself** — spawn a sub-agent (Stage 2)
- **Do NOT skip the interview** — it determines the architecture classification
- **Do NOT skip validation** — anthropic-validator catches structural issues
- **Do NOT skip the post-generation summary** — users need to know what was decided and why
- **Do NOT write agents in task-instruction register** — agents use system-prompt register (WHO, not WHAT)

If you find yourself thinking "I can generate this directly without a sub-agent" — STOP. The sub-agent reads templates, agent-conventions, and content guidance that produce structurally correct output. The pipeline exists for consistency, not speed.

---

## Pipeline

```fsharp
// create-agent pipeline
PreFlight(args)                              // Stage 0: Orchestrator — parse input, adaptive interview
|> Classify(interview_answers)               // Stage 1: Orchestrator — three independent decisions
|> Generate(classification, template, conventions) // Stage 2: Sonnet sub-agent — produce agent file
|> Validate(generated_output)                // Stage 3: Orchestrator — run anthropic-validator
|> Refine(validator_findings)                // Stage 4: Sonnet sub-agent (conditional, max 2 retries)
|> DeployAndPresent(working_dir, target_dir)  // Stage 5: Orchestrator — deploy to target + post-generation summary
|> Diagnostics()                             // Stage 6: Orchestrator — write YAML
```

---

## Stage Definitions

### Stage 0: Pre-Flight (Orchestrator)

```
Stage 0: Pre-Flight
├── Parse arguments (description, name, or --doc path)
├── Load references/decision-framework.md
├── Load references/agent-conventions.md
├── Load references/content-guidance.md
├── Load subagent-prompting skill
├── If --doc provided:
│   ├── Read the requirements document
│   ├── Extract answers to Q1-Q5 from the document
│   └── Present extracted answers to user for confirmation via AskUserQuestion
├── If no --doc:
│   └── AskUserQuestion: Present all 5 core questions from decision-framework.md
│       ├── Q1: What is this agent's identity and mission? (2-3 invocation examples)
│       ├── Q2: What tools does it need access to?
│       ├── Q3: Single focused task, or multiple stages/operations?
│       ├── Q4: Does it need structured diagnostic output?
│       └── Q5: Restricted permissions or full access?
├── If complexity detected in answers:
│   └── AskUserQuestion: Follow-up questions per decision-framework.md
│       ├── Q6: Do stages depend on each other's output?
│       ├── Q7: Do workers need direct communication?
│       ├── Q8: Error handling between stages?
│       ├── Q9: Diagnostic format — YAML, Markdown, or both?
│       └── Q10: Which specific tools allowed/forbidden?
├── Determine agent name (from input or derived from description)
│   └── Target: .claude/agents/{agent-name}.md
├── Set working directory: tmp/create-agent/{agent-name}/
│   └── All generation and refinement happens here to avoid .claude/ edit approval storms
│       Files are deployed to the target directory only after validation passes (Stage 5)
└── Token budget check (warn if >30% consumed)
```

**Interview behavior**: Maximum 2 AskUserQuestion rounds. Present Q1-Q5 together in round 1. Follow-ups (if needed) in round 2. Do NOT ask questions one at a time.

### Stage 1: Classify (Orchestrator)

Apply the three-decision classification from `references/decision-framework.md`:

```
Stage 1: Classify
├── Decision A: Architecture
│   ├── Single focused task → single-agent
│   ├── Multiple dependent stages → pipeline orchestrator
│   └── Workers need direct communication → Agent Teams (experimental warning)
├── Decision B: Tool Permissions
│   ├── Full access → no tools: list in frontmatter
│   ├── Restricted → tools: [specific list] in frontmatter
│   └── If Write/Edit/Bash needed → include constraints in protocol
├── Decision C: Supporting Configuration
│   ├── Always: Permissions Setup section
│   ├── If diagnostics needed: diagnostic output section + schema
│   ├── If sub-agents: 4-part prompt template + subagent-prompting dependency
│   └── If Agent Teams: experimental warning + env var gating
├── Map decisions → template (1 of 3 from decision-framework.md)
└── Present classification to user via AskUserQuestion:
    ├── "Architecture: {single/pipeline/teams} — {reason}"
    ├── "Tool permissions: {full/restricted: [list]} — {reason}"
    ├── "Configuration: {list} — {reason}"
    ├── "Template: {template name}"
    └── "Proceed with generation? [Yes / Adjust]"
```

**MANDATORY**: Wait for user confirmation before proceeding to Stage 2. If user selects "Adjust", re-classify with their feedback.

### Stage 2: Generate (Sonnet sub-agent)

```
Stage 2: Generate
├── Read the selected template from references/template-{type}.md
├── Construct prompt using 4-part template (GOAL/CONSTRAINTS/CONTEXT/OUTPUT):
│   ├── GOAL: Generate a complete, structurally correct agent definition matching
│   │   the classification. The agent must use system-prompt register and include
│   │   all required sections (Pre-Flight, Mission, Protocol, Output, Permissions).
│   ├── CONSTRAINTS:
│   │   ├── Write in SYSTEM-PROMPT REGISTER — WHO the agent IS, not WHAT to do
│   │   ├── Open with identity statement: "You are a..."
│   │   ├── Use present tense for behavioral descriptions
│   │   ├── Description MUST be a single line (multi-line breaks discovery)
│   │   ├── Description MUST use role-based trigger framing
│   │   ├── Include Pre-Flight Gate with MUST/MUST NOT (binding language)
│   │   ├── Include DO/DO NOT mission section
│   │   ├── Include Tool Usage Constraints for every tool in frontmatter
│   │   ├── Include Permissions Setup section (tool permissions unsolved per #10093)
│   │   ├── Include Invocation section with Task tool example
│   │   ├── If pipeline: include F# pipeline notation and 4-part prompt template
│   │   ├── If teams: include experimental warning, fallback mode, teammate table
│   │   ├── Do NOT add unnecessary files (no README, CHANGELOG, LICENSE)
│   │   ├── Do NOT use emojis in generated content
│   │   └── Keep agent under target line count for the type
│   │       (single: 250, pipeline: 400, teams: 400)
│   ├── CONTEXT:
│   │   ├── Classification from Stage 1 (all three decisions + template)
│   │   ├── User's interview answers (identity, mission, tools from Q1-Q5)
│   │   ├── Selected template: references/template-{type}.md
│   │   ├── Agent conventions: references/agent-conventions.md
│   │   ├── Content guidance: references/content-guidance.md
│   │   ├── Instruction: "Read 1-2 existing agents from the codebase for structural
│   │   │   reference (use Glob to find .claude/agents/*.md)"
│   │   ├── Target output path: .claude/agents/{agent-name}.md (final deployment location)
│   │   └── Working directory: tmp/create-agent/{agent-name}/
│   └── OUTPUT:
│       ├── Write agent file to {working-directory}/{agent-name}.md
│       └── Return summary: file path with line count
├── Spawn: Task(description="Generate agent file", subagent_type="general-purpose",
│          model="sonnet", prompt=...)
├── Read generator output (file path + summary)
└── Verify file was created (Read {working-directory}/{agent-name}.md)
```

### Stage 3: Validate (Orchestrator)

```
Stage 3: Validate
├── Invoke /anthropic-validator on the working directory
│   └── (Load the anthropic-validator skill and follow its workflow against {working-directory}/{agent-name}.md)
├── Read validator output
├── Check for critical/high findings:
│   ├── 0 critical AND 0 high → proceed to Stage 5 (skip Stage 4)
│   └── Any critical or high → proceed to Stage 4 (refine)
├── Check description is single-line (read agent file, verify no multiline description)
├── Check system-prompt register (body opens with identity, not task steps)
└── Check Permissions Setup section exists
```

### Stage 4: Refine (Sonnet sub-agent, conditional, max 2 retries)

This stage only runs if Stage 3 found critical or high issues.

```
Stage 4: Refine (attempt {N} of 2)
├── Construct prompt using 4-part template:
│   ├── GOAL: Fix all critical and high findings from anthropic-validator
│   ├── CONSTRAINTS:
│   │   ├── Only fix the specific issues identified — do not restructure
│   │   ├── Preserve the existing agent content and identity
│   │   ├── Description must remain single-line
│   │   └── Must remain in system-prompt register
│   ├── CONTEXT:
│   │   ├── Validator findings (critical and high items with descriptions)
│   │   ├── Current generated file (read from {working-directory}/{agent-name}.md)
│   │   └── Agent conventions: references/agent-conventions.md
│   └── OUTPUT: Edit file at {working-directory}/{agent-name}.md to fix findings
├── Spawn: Task(description="Fix validator findings", subagent_type="general-purpose",
│          model="sonnet", prompt=...)
├── Re-run Stage 3 (validate)
├── If still failing after 2 retries:
│   └── Proceed to Stage 5 with caveats noted
└── Token budget check
```

### Stage 5: Deploy & Present (Orchestrator)

```
Stage 5: Deploy & Present
├── Deploy: Move {working-directory}/{agent-name}.md to .claude/agents/{agent-name}.md
│   ├── This is the ONLY point where the file is written to .claude/
│   └── Clean up: Remove {working-directory}/ after successful copy
├── Read generated agent file from .claude/agents/{agent-name}.md for summary
├── Present to user:
│   ├── "Generated agent at: .claude/agents/{agent-name}.md"
│   ├── "Lines: {count}"
│   ├── "Architectural decisions:"
│   │   ├── "Architecture: {single/pipeline/teams} — {reason}"
│   │   ├── "Tool permissions: {full/restricted: [list]} — {reason}"
│   │   └── "Configuration: {list} — {reason}"
│   ├── "Template: {template used}"
│   ├── "Validation: {pass/fail with details}"
│   ├── If caveats: "Unresolved issues: {list}"
│   ├── "Permissions to configure:"
│   │   └── {List tool permissions that must be added to settings.json}
│   └── "Next steps:"
│       ├── "1. Review and customize the identity and expertise sections"
│       ├── "2. Adjust tool permissions in .claude/settings.json"
│       ├── "3. Test by invoking via Task tool: Task(subagent_type=\"{name}\", prompt=\"...\")"
│       ├── "4. Add project-specific protocol steps as needed"
│       └── "5. Configure Stop hook if diagnostic output is needed"
└── Note: This is a scaffold, not production-ready output (generate-and-customize contract)
```

### Stage 6: Diagnostics (REQUIRED)

**MANDATORY**: Write diagnostic output after every invocation. This cannot be skipped.

```
Stage 6: Diagnostics
├── Write to: logs/diagnostics/create-agent-{YYYYMMDD-HHMMSS}.yaml
│   └── Use templates/diagnostic-output.yaml schema
└── Include:
    ├── Input: description/name/doc path
    ├── Interview: questions asked, rounds completed
    ├── Classification: all three decisions + template selected
    ├── Generation: file created, line count, model used
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
| Agent file already exists at target path | AskUserQuestion: "Agent {name} already exists at .claude/agents/{name}.md. Overwrite / Choose different name / Cancel?" |
| Working directory already exists | Silently remove and recreate tmp/create-agent/{agent-name}/ (working dirs are ephemeral) |
| User rejects classification | Re-classify with user's feedback. Max 2 classification rounds. |
| Generated agent uses task-instruction register | Stage 4 refine with specific instruction to rewrite in system-prompt register. |

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
- [ ] Stage 0: Decision framework, agent conventions, and content guidance loaded
- [ ] Stage 0: Adaptive interview conducted (1-2 rounds)
- [ ] Stage 1: Three decisions made (architecture, tool permissions, configuration)
- [ ] Stage 1: Classification presented to user and confirmed
- [ ] Stage 2: Sonnet sub-agent spawned for generation
- [ ] Stage 2: Generated agent file verified to exist in working directory
- [ ] Stage 2: Agent uses system-prompt register (identity, not task steps)
- [ ] Stage 3: anthropic-validator run on generated agent
- [ ] Stage 4: Refinement attempted if validation found critical/high issues
- [ ] Stage 5: Agent file deployed from working directory to .claude/agents/
- [ ] Stage 5: Working directory cleaned up
- [ ] Stage 5: Post-generation summary presented with architectural decisions
- [ ] Stage 5: Permissions setup steps communicated
- [ ] Stage 5: Next steps communicated (scaffold, not production-ready)
- [ ] Stage 6: Diagnostic YAML written to `logs/diagnostics/`

**Do NOT return to user until all applicable checkboxes can be marked complete.**
