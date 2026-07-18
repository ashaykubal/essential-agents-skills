# Loop anatomy — section spec + DoD rules

Every generated LOOP.md carries these sections in this order. Drop a section only
consciously, with the reason in the header comment.

## Header comment

Author + date + mode (strategy/transform), the calibration note (what rigor was
adopted/skipped and why), and the read-only declaration: this file and the
project's decision log are READ-ONLY to the loop.

## GOAL

Outcome-shaped and measurable — what is TRUE when the phase closes, not what work
happens. Bad: "Harden the extractors." Good: "Every corpus message triaged and its
content extracted into a validated staging store; extractors green against the
Phase 0 bug list." If the goal cannot be falsified, the exit criteria won't be
either.

## Operating model

The project's model-routing block (see `model-routing.md`). If the target project
already has a canonical block in another loop, reference or copy it VERBATIM —
two divergent routing blocks in one project is drift.

## GATES

Owner attestations as checkboxes: id, plain-language description, what flips it,
which mini-loops it blocks. Rules:
- A gate blocks ONLY the mini-loops that name it. Siblings proceed. If a gate
  would block everything, the phase isn't ready for a loop.
- Every gate has an owner-visible flip action ("owner drops the export in
  uploads/", "owner signs off the spec in the decision log") — never "when ready".
- Pre-flipped gates are recorded with date + decision id, not deleted.

## Mini-loops

Each mini-loop: title, `(deps: …)` including gates, ordered tasks with model
routing hints where non-obvious, and a `DoD (programmatic)` block. Rules:
- A mini-loop is a unit whose DoD can flip green independently of its siblings.
- Setup/harness is always L0: environment, verifier install + smoke test on a
  planted defect, hooks installed AND probed, progress files initialized.
- Strategy-tier items inside an execution phase (design specs, eval gold checks)
  are marked as pre-scheduled Fable escalations — the orchestrator schedules
  them, it does not attempt them.
- Commit per green exit; cross-model review at every exit (see routing ref).

## DoD rules (the heart of the pattern)

Every DoD item must be checkable by a command, a test run, a file's existence, a
ledger read, or a score threshold against a committed harness. Litmus test: could
a Haiku agent verify the item without judgment? If not, rewrite it.

| Bad (vibes) | Good (programmatic) |
|---|---|
| "extraction works correctly" | "12/12 previously-failing URLs now fetch content or are logged verifiably dead" |
| "classifier is accurate" | "≥90% agreement with the 100-message labeled sample" |
| "no quality regressions" | "0 faithfulness violations on the eval-v2 harness, re-scored with frozen scorer prompts" |
| "reviewed and looks good" | "verifier review clean after ≤2 rebuttal rounds; findings ledgered" |

Numbers in DoDs cite their source (baseline, decision id, or measured projection)
— an uncited threshold is an invented one.

## GUARDRAILS

- `max_iterations` per mini-loop and `stop_if_no_progress` (N iterations without
  a DoD item flipping → record blocker, escalate). Both numeric.
- Spend envelopes read from a ledger the project actually writes; abort
  multipliers explicit ("abort batch at 2× logged projection").
- Concurrency cap from the project's ops rules.
- **FORBIDDEN list — hooks, not prose.** Every entry must be implementable as a
  PreToolUse hook (path pattern or content pattern). The project's test/eval
  suite is always on it ("never edit tests/gold to pass"). If an entry can't be
  hook-checked, it isn't a forbidden-list entry — it's guidance, put it elsewhere.

## MACHINERY

- `memory:` progress file path(s); dated entries; created by L0.
- `verifier:` the cross-model reviewer + the layering rule + the escalation path
  (maker ≤2 rebuttals → planner-tier arbitration → owner ledger).
- `trigger:` who starts it and what runs first.
- `exit:` what state closes the phase, including any provisional-close rule for
  open-gated mini-loops (close provisionally + coda when the gate lands).

## Self-check (run at Stage 5 — fix before emit)

1. Can every DoD item be verified by a command/test/score with no judgment?
2. Does every threshold cite a source?
3. Does every gate name its flip action and block only its own mini-loops?
4. Is every forbidden-list entry hook-implementable? Is the test/eval suite on it?
5. Is the layering rule stated? Mission-record read-only stated?
6. Is L0 a harness-setup loop with a verifier smoke test on a planted defect?
7. Are strategy-tier items marked as escalations rather than orchestrated tasks?
8. Do spend guardrails name the ledger they read? Concurrency cap present?
9. Could an Opus orchestrator run this with zero questions? Every question it
   would need to ask is a defect in the loop.
