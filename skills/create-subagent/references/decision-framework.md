# Decision Framework

Interview questions and classification logic for the create-subagent pipeline. The orchestrator uses this at Stage 0 (Pre-Flight) for interview + routing, and Stage 1 (Classify) for tool permissions and configuration decisions.

---

## Stage 0: Adaptive Interview

### Core Questions (Always Ask)

Present all 5 questions to the user via AskUserQuestion. These determine routing (single vs pipeline/teams redirect), tool needs, and diagnostic requirements.

| # | Question | What It Reveals |
|---|----------|-----------------|
| Q1 | What is this agent's identity and mission? Describe WHO it is and what expertise it has. Give 2-3 examples of how it would be invoked. | System-prompt content, invocation patterns, scope |
| Q2 | What tools does it need access to? (Read/Write/Edit/Bash/Glob/Grep/WebFetch/WebSearch/Task/other) | Tool permissions, safety constraints |
| Q3 | Does it orchestrate multiple distinct stages or operations, or perform a single focused task? | Routing check (single → proceed, multiple → follow-ups → possible redirect) |
| Q4 | Does it need to emit structured diagnostic output (logs, reports, YAML)? | Diagnostic section, output paths |
| Q5 | Should it have restricted permissions, or full access to available tools? | permissionMode, tool allowlist |

### Follow-Up Questions (Conditional)

Ask follow-ups when Q3 indicates multiple stages/operations. These determine whether to redirect to create-skill.

| Trigger | Follow-Up Questions |
|---------|-------------------|
| Q3 = "multiple stages" | Q6: Do the stages depend on each other's output? (sequential vs parallel) |
| Q3 = "multiple stages" | Q7: Do workers need to communicate with each other directly? (Task tool vs Agent Teams) |
| Q4 = "yes, diagnostics" | Q8: What format — YAML report, Markdown log, or both? |
| Q5 = "restricted" | Q9: Which specific tools should be allowed? Which should be explicitly forbidden? |

### Interview Behavior

- Present Q1-Q5 in a single AskUserQuestion call (not one-at-a-time)
- If answers are ambiguous, ask 1-2 clarifying follow-ups (do not over-interview)
- If the user provides a `--doc` requirements document, extract Q1-Q5 answers from it and present for confirmation instead of asking fresh
- Total interview: 1-2 AskUserQuestion rounds maximum

---

## Stage 0: Routing Check

After receiving all interview answers, check whether the use case requires pipeline orchestration. Sub-agents are single-purpose — they cannot spawn other sub-agents.

### Routing Logic

```
Q3 = "single focused task"                → PROCEED to Stage 1 (single-agent)
Q3 = "multiple stages"
  AND Q6 = "dependent stages"             → REDIRECT to /create-skill
Q3 = "multiple stages"
  AND Q7 = "direct worker communication"  → REDIRECT to /create-skill
Q3 = "multiple stages"
  AND Q6 = "independent"
  AND Q7 = "no direct communication"      → PROCEED to Stage 1 (independent parallel
                                             workers are still single-purpose agents —
                                             create each one separately)
```

### Redirect Message

If routing check triggers a redirect, present this message and STOP:

```
This use case requires a pipeline skill that orchestrates multiple sub-agents.
Sub-agents are single-purpose — they can't spawn other sub-agents.

Use /create-skill instead. It will generate:
- An orchestrating skill (SKILL.md) with pipeline stages
- Dedicated sub-agent files (.claude/agents/*.md) for each stage

The generated sub-agents will have deterministic behavior locked into their
system prompts, and the orchestrating skill handles sequencing, error handling,
and synthesis.
```

Do NOT proceed to Stage 1 after a redirect. Write diagnostic YAML with `outcome: redirected`.

---

## Stage 1: Two-Decision Classification

After the interview (and routing check passes), make two independent decisions. Each decision is self-contained.

### Decision A: Tool Permissions

Determines the agent's tool access and safety constraints.

```
Q5 = "full access"                       → no tools: list in frontmatter (inherits all)
Q5 = "restricted"
  AND Q9 = specific list                → tools: [listed tools] in frontmatter
Q2 = includes "Write" or "Edit"          → include quality gate guidance in protocol
Q2 = includes "Bash"                     → include allowed/forbidden command lists in protocol
```

**Default**: Restrict tools to what the agent actually needs. Fewer tools = safer agent.

### Decision B: Supporting Configuration

Determines what additional configuration the agent needs.

```
Always:
  → Include "Permissions Setup" section documenting manual config

If Q4 = "yes, diagnostics":
  → Include diagnostic output section with paths and schema
  → Add subagent-output-templating to skills: dependency (if reporting to orchestrator)
```

### Classification Output

After classification, present the two decisions to the user for confirmation before proceeding to Stage 2:

```
Classification:
- Tool permissions: {full/restricted: [list]} — {one-line reason}
- Configuration: {list of extras} — {one-line reason}

Proceed with generation? [Yes / Adjust]
```

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| Q3 = "multiple stages" but Q6/Q7 answers are ambiguous | Ask one clarifying question. If still ambiguous, default to redirect (safer to use create-skill than to create an infeasible agent). |
| Agent needs Write but no quality gates exist in target project | Include quality gate section with "adapt to project's quality enforcement" note. |
| User provides conflicting Q2/Q5 answers | Ask one clarifying question to resolve. |
| Very complex agent (>250 lines estimated) | Warn about complexity. Suggest splitting into focused agent + orchestrating skill. |
| User explicitly requests a pipeline agent | Redirect to create-skill. Explain: "Pipeline agents are infeasible as sub-agents because sub-agents cannot spawn other sub-agents." |
