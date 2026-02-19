# Decision Framework

Interview questions and classification logic for the skill-creator pipeline. The orchestrator uses this at Stage 0 (Pre-Flight) and Stage 1 (Classify).

---

## Stage 0: Adaptive Interview

### Core Questions (Always Ask)

Present all 5 questions to the user via AskUserQuestion. These determine the skill type, context mode, and supporting file needs.

| # | Question | What It Reveals |
|---|----------|-----------------|
| Q1 | What does this skill do? Give 2-3 concrete examples of how someone would invoke it. | Scope, trigger patterns, invocation style |
| Q2 | Does it need conversation history, or can it run in complete isolation? | Context mode (inline vs fork) |
| Q3 | Does it orchestrate multiple distinct operations or analyses? | Sub-agent pattern (none, sequential, parallel) |
| Q4 | How much domain-specific reference content does it need? (None / Some / Extensive) | Supporting file structure (vanilla vs references/) |
| Q5 | Does it produce structured output that must match a specific format? | Templates directory need |

### Follow-Up Questions (Conditional)

Ask follow-ups when Q1-Q5 answers indicate complexity. Trigger conditions:

| Trigger | Follow-Up Questions |
|---------|-------------------|
| Q3 = "yes, multiple operations" | Q6: Do the operations depend on each other's output? (sequential vs parallel) |
| Q3 = "yes, multiple operations" | Q7: Do workers need to communicate with each other directly? (Task tool vs Agent Teams) |
| Q3 = "yes" AND Q2 = "isolation" | Q8: What error handling is needed between stages? (retry, fallback, abort) |
| Q4 = "extensive" | Q9: Is the reference content static (loaded once) or dynamic (computed per run)? |
| Q5 = "yes, structured" | Q10: Is the output format YAML, Markdown with sections, or something else? |

### Interview Behavior

- Present Q1-Q5 in a single AskUserQuestion call (not one-at-a-time)
- If answers are ambiguous, ask 1-2 clarifying follow-ups (do not over-interview)
- If the user provides a `--doc` requirements document, extract Q1-Q5 answers from it and present for confirmation instead of asking fresh
- Total interview: 1-2 AskUserQuestion rounds maximum

---

## Stage 1: Three-Decision Classification

After the interview, make three independent decisions. Each decision is self-contained — they don't depend on each other.

### Decision A: Context Mode

Determines whether the skill runs inline (access to conversation) or forked (isolated context).

```
Q2 = "needs conversation history"    → inline (no fork)
Q2 = "can run in isolation"
  AND Q3 = "multiple operations"     → context: fork
Q2 = "can run in isolation"
  AND Q3 = "no"                      → inline (no fork)
  NOTE: Warn if user requests fork for a simple guideline/knowledge skill.
        Fork adds overhead with no benefit for inline knowledge.
```

**Default**: inline (no fork). Fork is rare — only 2 of 21 Claude Code skills use it.

### Decision B: Sub-Agent Pattern

Determines how the skill orchestrates work.

```
Q3 = "no, single operation"          → no sub-agents
Q3 = "yes" AND Q6 = "dependent"      → sequential Task tool sub-agents
Q3 = "yes" AND Q6 = "independent"    → parallel Task tool sub-agents
Q3 = "yes" AND Q7 = "direct comms"   → Agent Teams (experimental)
  NOTE: Include env var gating (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
        and experimental warning in generated skill.
```

**Default**: no sub-agents. Only add orchestration when the skill genuinely needs multiple distinct passes.

### Decision C: Supporting Files

Determines the file structure beyond SKILL.md.

```
Q4 = "none" AND Q5 = "no"            → vanilla SKILL.md only
Q4 = "some" or "extensive"           → add references/ directory
Q5 = "yes, structured output"        → add templates/ directory
Q3 = "yes" AND needs scripts         → add scripts/ directory
  NOTE: scripts/ is for deterministic code execution (AST analysis,
        data transforms). Not needed for LLM-only workflows.
```

### Decision → Template Mapping

| Classification | Template | File Structure |
|----------------|----------|----------------|
| No sub-agents, no references, no templates | `template-simple.md` | `SKILL.md` only |
| References needed, no sub-agents | `template-reference-heavy.md` | `SKILL.md` + `references/` |
| Sequential or parallel sub-agents | `template-pipeline.md` | `SKILL.md` + `references/` + `templates/` |
| Deterministic scripts required | `template-script-driven.md` | `SKILL.md` + `scripts/` + `references/` |
| Multi-agent research/brainstorm | `template-research.md` | `SKILL.md` + `references/` + `templates/` |

### Classification Output

After classification, present the three decisions to the user for confirmation before proceeding to Stage 2:

```
Classification:
- Context: {inline/fork} — {one-line reason}
- Sub-agents: {none/sequential/parallel/Agent Teams} — {one-line reason}
- Supporting files: {list} — {one-line reason}
- Template: {template name}

Proceed with generation? [Yes / Adjust]
```

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| User requests fork for simple knowledge skill | Warn: "Fork adds overhead with no benefit for inline knowledge skills. Recommend inline." Allow override. |
| User requests Agent Teams | Include experimental warning + env var check. Note: Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. |
| Skill type doesn't clearly map to one template | Pick the closest match, note the mismatch in post-generation summary. |
| User provides conflicting Q2/Q3 answers | Ask one clarifying question to resolve. |
| Very large skill (>500 lines estimated) | Warn about token budget. Suggest splitting into multiple skills. |
