# Decision Framework

Interview questions and classification logic for the create-agent pipeline. The orchestrator uses this at Stage 0 (Pre-Flight) and Stage 1 (Classify).

---

## Stage 0: Adaptive Interview

### Core Questions (Always Ask)

Present all 5 questions to the user via AskUserQuestion. These determine the agent architecture, tool needs, and diagnostic requirements.

| # | Question | What It Reveals |
|---|----------|-----------------|
| Q1 | What is this agent's identity and mission? Describe WHO it is and what expertise it has. Give 2-3 examples of how it would be invoked. | System-prompt content, invocation patterns, scope |
| Q2 | What tools does it need access to? (Read/Write/Edit/Bash/Glob/Grep/WebFetch/WebSearch/Task/other) | Tool permissions, safety constraints |
| Q3 | Does it orchestrate multiple distinct stages or operations, or perform a single focused task? | Architecture (single vs pipeline vs teams) |
| Q4 | Does it need to emit structured diagnostic output (logs, reports, YAML)? | Diagnostic section, output paths |
| Q5 | Should it have restricted permissions, or full access to available tools? | permissionMode, tool allowlist |

### Follow-Up Questions (Conditional)

Ask follow-ups when Q1-Q5 answers indicate complexity. Trigger conditions:

| Trigger | Follow-Up Questions |
|---------|-------------------|
| Q3 = "multiple stages" | Q6: Do the stages depend on each other's output? (sequential vs parallel) |
| Q3 = "multiple stages" | Q7: Do workers need to communicate with each other directly? (Task tool vs Agent Teams) |
| Q3 = "multiple stages" | Q8: What error handling is needed between stages? (retry, fallback, escalate) |
| Q4 = "yes, diagnostics" | Q9: What format — YAML report, Markdown log, or both? |
| Q5 = "restricted" | Q10: Which specific tools should be allowed? Which should be explicitly forbidden? |

### Interview Behavior

- Present Q1-Q5 in a single AskUserQuestion call (not one-at-a-time)
- If answers are ambiguous, ask 1-2 clarifying follow-ups (do not over-interview)
- If the user provides a `--doc` requirements document, extract Q1-Q5 answers from it and present for confirmation instead of asking fresh
- Total interview: 1-2 AskUserQuestion rounds maximum

---

## Stage 1: Three-Decision Classification

After the interview, make three independent decisions. Each decision is self-contained.

### Decision A: Architecture

Determines the agent's structural complexity.

```
Q3 = "single focused task"              → single-agent (template-single-agent.md)
Q3 = "multiple stages"
  AND Q6 = "dependent stages"           → pipeline orchestrator (template-pipeline-agent.md)
Q3 = "multiple stages"
  AND Q7 = "direct worker communication" → Agent Teams (template-teams-agent.md)
  NOTE: Include env var gating (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
        and experimental warning in generated agent.
```

**Default**: single-agent. Only add orchestration when the agent genuinely coordinates multiple distinct passes.

### Decision B: Tool Permissions

Determines the agent's tool access and safety constraints.

```
Q5 = "full access"                       → no tools: list in frontmatter (inherits all)
Q5 = "restricted"
  AND Q10 = specific list                → tools: [listed tools] in frontmatter
Q2 = includes "Write" or "Edit"          → include quality gate guidance in protocol
Q2 = includes "Bash"                     → include allowed/forbidden command lists in protocol
```

**Default**: Restrict tools to what the agent actually needs. Fewer tools = safer agent.

### Decision C: Supporting Configuration

Determines what additional configuration the agent needs.

```
Always:
  → Generate Stop hook for diagnostic output (if Q4 = yes)
  → Include "Permissions Setup" section documenting manual config

If Q3 = "multiple stages":
  → Include 4-part prompt template in protocol
  → Add subagent-prompting to skills: dependency

If Q4 = "yes, diagnostics":
  → Include diagnostic output section with paths and schema
  → Add subagent-output-templating to skills: dependency (if reporting to orchestrator)
```

### Decision -> Template Mapping

| Classification | Template | What It Generates |
|----------------|----------|-------------------|
| Single focused task, no sub-agents | `template-single-agent.md` | Agent .md with identity, protocol, output |
| Multi-stage pipeline orchestrator | `template-pipeline-agent.md` | Agent .md with stages, sub-agent spawning, prompt template |
| Agent Teams with peer communication | `template-teams-agent.md` | Lead agent .md + teammate definitions |

### Classification Output

After classification, present the three decisions to the user for confirmation before proceeding to Stage 2:

```
Classification:
- Architecture: {single/pipeline/teams} — {one-line reason}
- Tool permissions: {full/restricted: [list]} — {one-line reason}
- Configuration: {list of extras} — {one-line reason}
- Template: {template name}

Proceed with generation? [Yes / Adjust]
```

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| User requests Agent Teams | Include experimental warning + env var check. Note: Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. |
| Agent needs Write but no quality gates exist in target project | Include quality gate section with "adapt to project's quality enforcement" note. |
| Agent architecture doesn't clearly map to one template | Pick the closest match, note the mismatch in post-generation summary. |
| User provides conflicting Q3/Q5 answers | Ask one clarifying question to resolve. |
| Very complex agent (>400 lines estimated) | Warn about complexity. Suggest splitting into lead agent + specialized sub-agents. |
