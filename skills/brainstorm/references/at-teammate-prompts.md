# AT Teammate Prompt Structure (--exploratory mode)

This reference defines the mandatory prompt sections for Agent Teams teammates in `--exploratory` mode. Load this file at Stage 3B only.

---

## Prompt Sections

Each teammate prompt MUST include these sections:

**1. Role instructions** — from the corresponding `references/role-*.md` file

**2. Input context** — problem statement, research synthesis (if available), SME output

**3. Dual-Output Contract:**

> You MUST produce TWO outputs:
>
> **Output 1 — Full analysis:** Write your complete analysis to `$PROJECT_DIR/logs/brainstorm/{topic-slug}/{NN}-{role-slug}.md` using the output template provided. This is the permanent record.
>
> **Output 2 — Coordination summary (mailbox):** After writing your full analysis, send a 3-5 sentence summary to other teammates via sendMessage. Include: your recommendation (proceed/modify/defer/kill), your top finding, and your strongest concern.

**4. Peer Debate Directives:**

> **Selective challenge protocol:** After receiving summaries from other teammates:
> - Read each teammate's summary
> - If you DISAGREE with a position, send a targeted challenge via sendMessage explaining WHY you disagree with evidence
> - If you AGREE, do NOT send a message (avoid noise)
> - You may update your log file after the debate if your position changed — append a "## Post-Debate Update" section

**5. AT Mitigation Patterns (ALL 3 MANDATORY in every teammate prompt):**

> **CC-to-lead:** After any peer message exchange, also send a 1-line summary to the lead so the lead can track debate progress.
>
> **Task list coordination:** Update your task status to mark progress. Set to completed when your full analysis is written AND you have reviewed all peer summaries.
>
> **Completion signal:** When you have finished all work (analysis written, peer summaries reviewed, challenges sent if any), send a final message to the lead: "WORK COMPLETE — [role name]"

**6. Critical Analyst — special AT directive (in addition to standard Critic prompt):**

> **Deferred verdict:** You are active from the start of the debate, not a sequential gatekeeper. Challenge early findings from other teammates as they arrive. However, do NOT form your final verdict until all teammates have shared their summaries. Your formal verdict belongs in your log artifact, not in peer messages. In your log file, include a "## Debate Influence" section documenting which peer positions you challenged and how the debate shaped your final verdict.

---

## AT Configuration (Hardcoded)

| Setting | Value | Rationale |
|---------|-------|-----------|
| Display mode | In-process | WSL2 safe default |
| Lead mode | Delegate | Coordination only — lead does not do analysis |
| Communication | Selective challenge | Broadcast summary once, respond only to disagreements |
| Teammate count | 3 | Fixed for v1 |

---

## AT Failure Recovery

- **Teammate fails mid-debate**: Fall back to Stage 3A for the failed role only. Partial AT output from successful teammates feeds into fallback as additional context.
- **All teammates fail**: Fall back to full Stage 3A (--scoped pipeline).
- **Lead context compaction**: Known platform limitation. Structural mitigation: SME runs before AT (reduces lead context pressure). Document in diagnostics if observed.
