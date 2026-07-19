# Runner integration — driving mini-loops with /goal

The generated LOOP.md is a spec, not a runner. Where the target harness is
Claude Code ≥ 2.1.139, the built-in `/goal` command is the preferred runner for
a mini-loop: **one mini-loop = one fresh session = one goal**. This file defines
how the loop author wires that up. (Lineage: Anthropic's long-running-agents
patterns — github.com/anthropics/cwc-long-running-agents — and the /goal docs
at code.claude.com/docs/en/goal.)

## What /goal is (and its four limits — design around all of them)

`/goal <condition>` is a session-scoped prompt-based Stop hook: after every
turn, a small fast model (Haiku-class) judges the condition against the
TRANSCRIPT ONLY and either clears the goal or feeds its reason into the next
turn as guidance.

1. **Transcript-only evaluator** — it runs no commands and reads no files. A
   condition is only as good as the evidence the builder surfaces
   in-conversation. "Output shown in this conversation" is a load-bearing
   clause, not decoration.
2. **≤4,000 chars, one goal per session** — a goal is mini-loop-sized, never
   phase-sized. "The whole LOOP.md is done" is a malformed condition.
3. **Same session throughout** — context accumulates across goal turns. A goal
   that needs 30+ turns is a decomposition defect in the loop, not a runner
   problem: split the mini-loop.
4. **Availability** — requires hooks enabled and a trusted workspace; absent in
   other harnesses and older versions. Every loop states the fallback ladder
   (below) in MACHINERY.

The convergence to exploit: loop-anatomy's DoD litmus is *"could a Haiku agent
verify this without judgment?"* — the /goal evaluator IS that Haiku agent. A
DoD written to house standard is already 90% of a well-formed goal condition.

## The GOAL line (one per mini-loop, emitted by the generator)

Template — adapt names and paths, keep every clause:

    GOAL: Mini-loop L{n} of {loop path} is green: every L{n} DoD item's check
    has been RUN this session with its output shown in this conversation and
    tee'd to {evidence dir}; dod-status.json shows all L{n} items true;
    {verifier} review verdict pasted (clean after ≤2 rebuttals); work
    committed. Constraints: {the 1–3 forbidden rules a transcript can betray}.
    Report BLOCKED if {stop_if_no_progress} consecutive turns pass without a
    DoD item flipping, or after {max_iterations} turns total.

Rules:
- Every claim in the condition must be transcript-demonstrable. The evaluator
  cannot read dod-status.json — it can only see the builder show it.
- The turn bound restates GUARDRAILS `max_iterations` / `stop_if_no_progress`
  because the evaluator can't read the guardrails block either.
- Constraints name only the forbidden rules whose violation would show in a
  transcript; the full list is enforced by hooks regardless. Hooks and /goal
  compose — /goal IS a Stop hook, and PreToolUse hooks still fire under it.

## What /goal does NOT replace

- **The evidence-gate hook chain** (loop-anatomy §DoD rules): the /goal
  evaluator sees only what the builder chose to surface — it is gameable by
  narration. The deterministic layer is the hooks; /goal is the convenience
  layer on top. Never trade the first for the second.
- **Cross-model review**: keep "{verifier} verdict pasted" in the condition. A
  transcript-only Haiku check never substitutes for a reviewer that reads the
  actual diff.
- **Gates, spend envelopes, model routing**: human attestations, ledger aborts,
  and routing economics live in the LOOP.md and its hooks. A goal never
  encodes them.

## Session discipline (one mini-loop = one fresh session)

Context rot is the enemy of long runs. Per mini-loop, the orchestrator:
1. starts a FRESH session (or `/clear`);
2. re-reads the handoff surface: LOOP.md, PROGRESS.md, dod-status.json;
3. sets that mini-loop's GOAL line via `/goal` and works to green;
4. commits (green exit), updates PROGRESS.md, ends the session.

The commit-backstop hook (templates/hooks/) preserves anything uncommitted at
session end as a `WIP:`-prefixed commit — continuity insurance, never a green
exit. Green exits are always explicit commits made when the DoD flips.

## Fallback ladder (state it verbatim in MACHINERY)

1. `/goal` available → drive each mini-loop as above.
2. No `/goal` but hooks work → a project Stop hook carrying the same condition
   text (prompt-based Stop hooks are what /goal wraps).
3. Neither (other harness / SDK / old version) → plain orchestrator iteration
   against the DoD, exactly as pre-v1.2 loops ran.

The LOOP.md must be complete enough that each degradation step loses
convenience, never correctness.
