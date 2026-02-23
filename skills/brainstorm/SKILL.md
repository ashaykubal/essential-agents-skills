---
name: brainstorm
description: Role-based brainstorming using 5 sequenced Opus sub-agents (SME, PM, Architect, Dev Lead, Critic). Use when evaluating feasibility and defining implementation approach for a researched topic.
user-invocable: true
argument-hint: "<topic, filepath, or directory> [--research <synthesis-file>]"
skills:
  - subagent-prompting
---

# Bulwark Brainstorm

Role-based brainstorming on a given topic. Spawns 5 Opus sub-agents in a sequenced pipeline (Project SME first, 3 role agents in parallel, Critical Analyst last), then synthesizes into a single brainstorm document with actionable recommendations.

---

## When to Use This Skill

**Load this skill when the user request matches ANY of these patterns:**

| Trigger Pattern | Example User Request |
|-----------------|---------------------|
| Implementation evaluation | "Should we build X?", "Evaluate this approach" |
| Feasibility assessment | "Is this feasible?", "How would we implement X?" |
| Architecture brainstorm | "Design the approach for X", "How should X fit into our system?" |
| Post-research planning | "We've researched X, now plan the implementation" |
| Role-based analysis | "Get PM/architect/dev perspectives on X" |

**DO NOT use for:**
- Initial topic research (use `bulwark-research` first)
- Quick technical questions (ask directly)
- Code review (use `code-review`)
- Debugging (use `issue-debugging`)

---

## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Role definitions** | `references/role-*.md` | **REQUIRED** | Load each before spawning its agent |
| **Role output template** | `templates/role-output.md` | **REQUIRED** | Include in PM, Architect, Dev Lead prompts |
| **Critic output template** | `templates/critic-output.md` | **REQUIRED** | Include in Critical Analyst prompt |
| **Synthesis template** | `templates/synthesis-output.md` | **REQUIRED** | Use when writing synthesis |
| **Subagent prompting** | `subagent-prompting` skill | **REQUIRED** | Load at Stage 1 for 4-part prompt template |
| **Research synthesis** | `--research <file>` | OPTIONAL | If provided, include in all agent prompts |

**Fallback behavior:**
- If a role reference file is missing: Note in diagnostic log, skip that role, continue with remaining agents
- If output template is missing: Use the schema from this SKILL.md directly
- If research synthesis not provided: Agents work from problem statement alone (warn user that quality may be lower)

---

## Usage

```
/brainstorm <topic-or-prompt> [--research <synthesis-file>]
/brainstorm --doc <path-to-document> [--research <synthesis-file>]
```

**Arguments:**
- `<topic-or-prompt>` - Free-text topic description or problem statement
- `--doc <path>` - Use a document as the topic source
- `--research <synthesis-file>` - Path to Phase 1 research synthesis (from bulwark-research). Strongly recommended.

**Examples:**
- `/brainstorm "agent teams" --research artifacts/research/agent-teams/synthesis.md` - Brainstorm with research
- `/brainstorm --doc plans/proposal.md` - Brainstorm from a document
- `/brainstorm "loop detection"` - Brainstorm without prior research (warn user)

---

## Stages

### Stage 1: Pre-Flight

```
Stage 1: Pre-Flight
├── Read problem statement / document
├── Load research synthesis if --research provided
├── AskUserQuestion if ambiguous (iterative, 2-3 questions per round)
├── Slugify topic for output directory
├── Create output directories: $PROJECT_DIR/logs/brainstorm/{topic-slug}/ and $PROJECT_DIR/artifacts/brainstorm/{topic-slug}/
├── Load subagent-prompting skill
├── Load references/role-project-sme.md (needed for Stage 2)
└── Token budget check (warn if >30% consumed)
```

**AskUserQuestion Protocol (Pre-Spawn):**

If the problem statement is ambiguous, under-specified, or could benefit from scope boundaries:

1. Ask 2-3 clarifying questions using AskUserQuestion
2. Assess whether the answers provide sufficient clarity to construct high-quality prompts
3. If not, ask up to 3 more questions in a follow-up round
4. Repeat until clarity is achieved (no hard cap on rounds, but each round is 2-3 questions max)
5. If the problem statement is clear and well-scoped from the start, skip this step and note in diagnostics: `pre_flight_interview: skipped (problem statement sufficient)`

If `--research` was not provided, warn the user: "No research synthesis provided. Brainstorm quality is significantly higher when preceded by `/bulwark-research`. Proceed without research?"

### Stage 2: Project SME (Opus, Sequential — First)

```
Stage 2: Project SME
├── Load references/role-project-sme.md
├── Construct prompt using 4-part template
│   ├── GOAL: Establish project context relevant to the topic
│   ├── CONTEXT: Problem statement + research synthesis (if available)
│   └── OUTPUT: $PROJECT_DIR/logs/brainstorm/{topic-slug}/01-project-sme.md
├── Spawn general-purpose Opus agent
│   ├── Agent autonomously explores codebase (Glob, Grep, Read)
│   ├── NO hardcoded document paths — agent discovers what's relevant
│   └── Output documents which files were read and why
├── Read SME output
└── Token budget check
```

**CRITICAL — SME Autonomy**: The SME agent MUST NOT receive hardcoded project document paths. Instead:

- SME receives the problem statement and (optionally) research synthesis
- SME is spawned as `general-purpose` subagent type with Opus model
- SME autonomously explores the codebase using Glob, Grep, Read
- Instruct the SME: "Identify the MINIMUM files needed to answer: What exists relevant to this topic? Where are the integration points? What constraints apply? What must not be disrupted? Do NOT attempt to read the entire codebase."
- SME output documents which files it read and why

This makes the skill portable across any project.

### Stage 3: Role Analysis (3 Opus, Parallel)

```
Stage 3: Role Analysis
├── Load references/role-product-manager.md
├── Load references/role-technical-architect.md
├── Load references/role-development-lead.md
├── Load templates/role-output.md
├── Construct 3 prompts using 4-part template
│   ├── Each receives: problem statement + research synthesis + SME output
│   └── Each writes to: $PROJECT_DIR/logs/brainstorm/{topic-slug}/{NN}-{role-slug}.md
├── Spawn all 3 agents in parallel via Task tool
│   ├── subagent_type: general-purpose
│   ├── model: opus
│   └── All 3 in a single message (parallel)
├── Read all 3 outputs
└── Token budget check (checkpoint if >55%)
```

**CRITICAL**: Spawn all 3 agents in a single message with 3 Task tool calls. Do NOT spawn sequentially.

### Stage 4: Critical Analyst (Opus, Sequential — Last)

```
Stage 4: Critical Analyst
├── Load references/role-critical-analyst.md
├── Load templates/critic-output.md
├── Construct prompt using 4-part template
│   ├── CONTEXT includes ALL prior outputs:
│   │   ├── Problem statement + research synthesis
│   │   ├── SME output (01-project-sme.md)
│   │   ├── PM output (02-product-manager.md)
│   │   ├── Architect output (03-technical-architect.md)
│   │   └── Dev Lead output (04-development-lead.md)
│   └── OUTPUT: $PROJECT_DIR/logs/brainstorm/{topic-slug}/05-critical-analyst.md
├── Spawn general-purpose Opus agent
├── Read Critical Analyst output
└── Token budget check
```

**CRITICAL**: The Critical Analyst MUST receive ALL 4 prior outputs. This is the whole point — the Critic synthesizes and challenges everything.

### Stage 5: Synthesis

```
Stage 5: Synthesis
├── Read ALL 5 agent output files (MANDATORY — do not skip any)
├── If any output is missing or empty → re-spawn that agent once (max 1 retry)
├── If retry fails → document gap in synthesis under "Incomplete Coverage"
├── Load templates/synthesis-output.md
├── Write synthesis to $PROJECT_DIR/artifacts/brainstorm/{topic-slug}/synthesis.md
├── AskUserQuestion for user on open questions (iterative, 2-3 per round)
├── Critical Evaluation Gate (see below)
└── Token budget check (must be <65% after synthesis)
```

**Enforcement**: Do NOT begin writing synthesis until ALL available agent outputs have been read. The orchestrator must reference every agent's output at least once in the synthesis.

#### Critical Evaluation Gate (Post-User Q&A)

After each AskUserQuestion round, do NOT blindly incorporate user responses. Instead:

**Step 1 — Classify each user response:**

| Classification | Definition | Action |
|---------------|------------|--------|
| **Preference** | Scope, priority, or UX choice (e.g., "I'd prefer v1 to focus on X", "Let's defer Y") | Incorporate directly. These are user decisions — no validation needed. |
| **Technical Claim** | Assertion about a technology, library, or API (e.g., "Library X supports this", "That API has rate limits") | **Do NOT incorporate.** Trigger Step 2. |
| **Architectural Suggestion** | Proposed structural approach (e.g., "What if we structure it as a plugin?", "We could use event sourcing") | **Do NOT incorporate.** Trigger Step 2. |

**Step 2 — For Technical Claims and Architectural Suggestions, present to user:**

> "Your suggestion about [X] involves a technical claim / architectural approach that hasn't been validated against the codebase and research. I recommend a targeted follow-up with 2 focused agents (Technical Architect + Critical Analyst) to verify feasibility and stress-test the approach.
>
> This will spawn 2 Opus agents and consume additional token budget.
>
> [Run follow-up validation / Incorporate as-is with LOW confidence caveat]"

**Step 3 — If follow-up validation approved:**

1. Spawn 2 Opus agents in parallel (single message, 2 Task tool calls):
   - **Technical Architect** — validates the suggestion against the codebase and research:
     GOAL: Validate whether [{user_suggestion}] is technically feasible for this project.
     Include the Propose-Challenge-Refine reasoning depth instructions.
     Agent has access to Glob, Grep, Read for codebase exploration.
   - **Critical Analyst** — stress-tests the suggestion:
     GOAL: Challenge [{user_suggestion}]. Is this the simplest approach? What assumptions does it introduce? What would change the verdict?
     Include the Highest-Risk Assumption Focus reasoning depth instructions.
2. Use the same 4-part prompt template (GOAL/CONSTRAINTS/CONTEXT/OUTPUT)
3. Provide both agents with: original research synthesis, SME output, and the specific user suggestion
4. Output to: `$PROJECT_DIR/logs/brainstorm/{topic-slug}/followup-{NN}-architect.md` and `followup-{NN}-critic.md`
5. Read both outputs, then update synthesis with validated findings
6. Tag follow-up findings in synthesis with: `[Follow-up: validated]` or `[Follow-up: refuted]` or `[Follow-up: mixed — see details]`

**Step 4 — If user declines follow-up:**

Incorporate the user's suggestion into synthesis with an explicit caveat:
> **[Unvalidated — user suggestion, not verified against codebase or research]**: {suggestion}

**Repeat**: After updating synthesis, ask if user has additional questions or input. Apply the same classification gate to each round. There is no limit on follow-up rounds, but each round with Technical Claim / Architectural Suggestion input that triggers validation consumes ~15-20% token budget (2 Opus agents) — warn user if approaching 55%.

### Stage 6: Diagnostics (REQUIRED)

```
Stage 6: Diagnostics
├── Write diagnostic YAML to $PROJECT_DIR/logs/diagnostics/brainstorm-{YYYYMMDD-HHMMSS}.yaml
└── Verify completion checklist
```

---

## Roles (Sections)

Each role brings a distinct professional perspective. Execution order matters — later agents build on earlier outputs.

### Role 1: Project SME (Sequential — First)

**Purpose**: Establish what exists, what has been built, and where the topic fits in the current architecture.

**Focus Areas**:
- Current project architecture relevant to the topic
- Existing assets that relate to or would be affected
- Integration points — where does this connect?
- Constraints imposed by current design decisions
- What the project already does well that must not be disrupted

**Execution**: Solo, first. Output feeds all subsequent agents.

**Reference**: `references/role-project-sme.md`

### Role 2: Senior Product Manager (Parallel — Second)

**Purpose**: Evaluate user value, prioritization, and scope boundaries.

**Focus Areas**:
- User value proposition — who benefits and how?
- Prioritization — what delivers the most value soonest?
- Scope boundaries — what is v1 vs. deferred?
- Success criteria — how do we know this works?
- Risk to user experience if implemented poorly

**Execution**: Parallel with Architect and Dev Lead. Receives SME output.

**Reference**: `references/role-product-manager.md`

### Role 3: Senior Technical Architect (Parallel — Second)

**Purpose**: Define system design, patterns, and technical trade-offs.

**Focus Areas**:
- Architectural approach — how should this be structured?
- Design patterns that apply (and which to avoid)
- Technical trade-offs and their implications
- Integration architecture — how it connects to existing systems
- Extensibility and future-proofing considerations

**Execution**: Parallel with PM and Dev Lead. Receives SME output.

**Reference**: `references/role-technical-architect.md`

### Role 4: Senior Development Lead (Parallel — Second)

**Purpose**: Assess implementation feasibility, effort, and practical risks.

**Focus Areas**:
- Implementation feasibility — can this be built with available tools?
- Effort estimation — complexity and session count
- Implementation risks — what could go wrong during building?
- Testing strategy — how do we verify this works?
- Dependencies and ordering — what must be built first?

**Execution**: Parallel with PM and Architect. Receives SME output.

**Reference**: `references/role-development-lead.md`

### Role 5: Critical Analyst (Sequential — Last)

**Purpose**: Perform cost-benefit analysis, challenge assumptions, poke holes.

**Focus Areas**:
- Cost-benefit analysis — is the investment justified?
- Assumption challenges — what might be wrong?
- Gaps in the proposals — what has been overlooked?
- Simpler alternatives — could a less ambitious approach work?
- Kill criteria — under what conditions should this be abandoned?
- Final verdict: proceed / modify / defer / kill

**Execution**: Solo, last. Receives ALL prior outputs.

**Reference**: `references/role-critical-analyst.md`
**Output template**: `templates/critic-output.md` (has verdict section)

---

## Execution Flow (F# Pipeline)

```fsharp
// Internal agent flow for brainstorm
ProjectSME(topic, research?)           // Stage 2: Opus, solo
|> [ProductManager, TechArchitect, DevLead](sme_output)  // Stage 3: 3 Opus, parallel
|> CriticalAnalyst(all_prior_outputs)  // Stage 4: Opus, solo
|> Synthesis                           // Stage 5: Orchestrator
```

---

## Token Budget Management

| Checkpoint | Threshold | Action |
|------------|-----------|--------|
| After constructing SME prompt | >30% consumed | Warn user: "5 agents will consume significant context" |
| After reading Stage 3 outputs | Running tally | If approaching 55%, checkpoint with user |
| After synthesis | Must be <65% | Leave room for session closing |
| Synthesis complete at >65% | Immediate | Create handoff, do not start additional work |

If token budget is insufficient to complete all 5 agents + synthesis, inform the user and suggest splitting (e.g., "SME + PM/Architect/Dev this session, Critic + synthesis next session").

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Agent returns empty output | Re-spawn once. If still empty, document gap in synthesis. |
| Agent returns truncated output | Accept as-is, note in diagnostics. |
| Agent fails to spawn | Re-spawn once. If still fails, skip role, document. |
| SME fails | STOP — subsequent agents depend on SME. Inform user. |
| Token budget exceeded mid-session | Stop spawning, synthesize from available outputs, note incomplete. |
| Research synthesis not provided | Warn user, proceed with lower quality. |

---

## Diagnostic Output (REQUIRED)

**MANDATORY**: You MUST write diagnostic output after every invocation. This is Stage 6 and cannot be skipped.

Write to: `$PROJECT_DIR/logs/diagnostics/brainstorm-{YYYYMMDD-HHMMSS}.yaml`

**Template**: Use `templates/diagnostic-output.yaml` for the schema. Fill in actual values from the session.

---

## Completion Checklist

**IMPORTANT**: Before returning to the user, verify ALL items are complete:

- [ ] Stage 1: Pre-flight complete (topic defined, directories created, skills loaded)
- [ ] Stage 1: AskUserQuestion used if topic was ambiguous
- [ ] Stage 1: User warned if --research not provided
- [ ] Stage 2: Project SME spawned (Opus) and output read
- [ ] Stage 2: SME explored codebase autonomously (no hardcoded paths)
- [ ] Stage 3: All 3 role agents spawned in parallel (Opus)
- [ ] Stage 3: All role outputs written to `$PROJECT_DIR/logs/brainstorm/{topic-slug}/`
- [ ] Stage 4: Critical Analyst spawned with ALL prior outputs
- [ ] Stage 4: Critic output read
- [ ] Stage 5: ALL 5 outputs read before writing synthesis
- [ ] Stage 5: Synthesis written using `templates/synthesis-output.md`
- [ ] Stage 5: AskUserQuestion used for post-synthesis review
- [ ] Stage 5: Critical Evaluation Gate applied to all user responses (classified as Preference/Technical Claim/Architectural Suggestion)
- [ ] Stage 5: Follow-up validation spawned for Technical Claims/Architectural Suggestions (or user declined with caveat added)
- [ ] Stage 5: Synthesis written to `$PROJECT_DIR/artifacts/brainstorm/{topic-slug}/synthesis.md`
- [ ] Stage 6: Diagnostic YAML written to `$PROJECT_DIR/logs/diagnostics/`

**Do NOT return to user until all checkboxes can be marked complete.**
