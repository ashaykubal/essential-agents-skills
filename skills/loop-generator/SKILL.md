---
name: loop-generator
description: Generate an executable LOOP.md — mini-loops with programmatic definition-of-done, human gates, model routing, and hooks-enforced guardrails — from a phase scope/plan document or a workpackage YAML.
when_to_use: When an implementation loop spec needs authoring or updating. Triggers - "create/draft/generate the loop", "LOOP.md", "loop per WP/workpackage", "implementation loop", "execution loop", "loop harness spec", converting a ratified plan/scope/WP into loop form.
user-invocable: true
argument-hint: "<scope-doc | WP.yaml> [--out <path>] [--batch <workpackages-dir>]"
allowed-tools:
  - AskUserQuestion
  - Bash
  - Glob
  - Grep
  - Read
  - Task
  - Write
version: 1.2.1
author: "Ashay Kubal @ Qball Inc."
---

# Loop Generator

Turn a ratified scope into an executable loop spec. Output is a `LOOP.md` in the
house pattern: an outcome-shaped GOAL, an operating-model block wired to the
project's model-routing decision, GATES for owner attestations, mini-loops in
dependency order each carrying its own **programmatic** definition-of-done and a
ready-to-paste **`/goal` runner condition**, a **default-FAIL DoD status file**
whose flips are evidence-gated by hooks, guardrails whose forbidden list is
hook-implementable, and machinery (progress files, runner + fallback ladder,
verifier protocol, triggers, exit).

The pattern distills the owner's mission harnesses: loop-per-unit-of-work,
layered verification (programmatic checks decide, cross-model review on top),
enforcement via hooks rather than prose — deterministic over behavioral, on
both the write side (forbidden list) and the claim side (evidence-gated DoD
flips). A complete worked example lives in `examples/` — self-contained, no
external project context required.

---

## When to Use This Skill

| Trigger | Action |
|---------|--------|
| A phase scope doc is ratified and needs its implementation loop | `/loop-generator docs/<scope>.md` (strategy mode) |
| A house-format WP YAML needs its per-WP loop | `/loop-generator plans/<slug>/workpackages/WP-X.yaml` (transform mode) |
| A workpackages/ directory needs loops for every WP | `/loop-generator --batch plans/<slug>/workpackages/` |
| An existing LOOP.md needs a new mini-loop added | Run in strategy mode with the LOOP.md + the new scope as inputs |

**DO NOT use for**: recurring/scheduled task execution (that is the built-in
`/loop` skill — an unrelated tool despite the name); running a loop (this skill
only authors the spec); plans that have no ratified scope yet (author the scope
or WP first — a loop generated from vibes inherits them).

**Model note**: strategy mode makes decomposition judgments — run it on the
planner-tier model per the owner's model policy (`references/model-routing.md`).
Transform mode is mechanical (the WP YAML already IS most of the filled-in
template) and runs fine on lower tiers. State which mode you are in before
starting.

---

## Mandatory Execution Checklist (BINDING)

**Every item below is mandatory. No deviations. No substitutions. No skipping.**

- [ ] **Stage 1 — Authorities**: project decision log located and read; model-routing
      decision, guardrail sources, and human-gate list extracted (or obtained via
      AskUserQuestion where the log is silent)
- [ ] **Stage 2 — Calibration**: `references/rigor-calibration.md` loaded; blast
      radius classified; adopt/skip choices recorded in the loop's header comment
- [ ] **Stage 3 — Decomposition**: mini-loops derived with explicit dependency
      order; every gated item names its gate; no mini-loop lacks a DoD
- [ ] **Stage 4 — Authoring**: `references/loop-anatomy.md` + `references/model-routing.md`
      + `references/goal-runner.md` + `templates/LOOP-template.md` loaded BEFORE
      writing; every template section present or consciously dropped with a
      reason in the header comment; every mini-loop carries its GOAL line; L0
      carries the evidence-gate install + probe items (templates/hooks/)
- [ ] **Stage 5 — Self-verification**: the checklist in `references/loop-anatomy.md`
      §Self-check run against the drafted loop; failures fixed before emit
- [ ] **Stage 6 — Emit**: LOOP.md written to the agreed path; summary to the user
      (mini-loop count, gates, spend envelopes, open questions); source scope/WP
      files NEVER modified
- [ ] **Batch mode only**: transform sub-agents (Sonnet) spawned in batches that
      respect the project's concurrency cap (default ≤4); each output spot-checked
      against its WP before acceptance

---

## Dependencies

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Loop anatomy + DoD rules** | `references/loop-anatomy.md` | **REQUIRED** | Stage 4, before writing |
| **Rigor calibration** | `references/rigor-calibration.md` | **REQUIRED** | Stage 2 |
| **Model routing** | `references/model-routing.md` | **REQUIRED** | Stage 4 (skippable in transform mode if the target project's routing block already exists — copy it verbatim instead) |
| **Runner integration** | `references/goal-runner.md` | **REQUIRED** | Stage 4 (GOAL lines + MACHINERY runner/fallback) |
| **Skeleton** | `templates/LOOP-template.md` | **REQUIRED** | Stage 4 |
| **Evidence-gate hooks** | `templates/hooks/*` | **REQUIRED** — the generated L0 copies/adapts them into the target project | Stage 4 (cite in L0), install happens when the loop runs |
| **Worked example** | `examples/example-phase-loop.md` | OPTIONAL | First loop in a project, or whenever unsure of the house voice |

**Fallback**: if a reference file is missing, `examples/example-phase-loop.md` is
the schema of record — read it before writing, and note the fallback in the
emitted loop's header comment.

---

## Stages

### Stage 1: Authorities

```
Stage 1: Authorities
├── Locate the project's decision log (docs/decisions.md, docs/mission/decision-log.md, …)
├── Extract: the model-routing decision · the build-process decision (however the
│   project names them) · privacy/billing constraints · concurrency/ops rules ·
│   known human gates
├── Locate the scope source: scope doc (strategy) or WP YAML (transform)
├── Read ALL of it — a loop that cites a doc its author never read is a defect
└── AskUserQuestion for anything the log is silent on that the loop needs:
    routing ladder, spend envelope, gate owners (2-3 questions per round)
```

The decision log is AUTHORITATIVE over every input. Where the scope doc and the
decision log disagree, the log wins and the discrepancy goes to the user.

### Stage 2: Rigor calibration

Load `references/rigor-calibration.md`. Classify the work's blast radius and
coordination surface; decide which rigor elements to adopt (mini-loops, hooks,
gates block, cross-model verifier scope) and which to skip (WP apparatus,
estimate arithmetic, citation regimes, gates registry). Record the calibration
as a short header comment in the emitted loop — the next reader should know what
was consciously skipped, not wonder what was forgotten.

### Stage 3: Decomposition (strategy mode; transform mode takes the WP's steps as-is)

```
Stage 3: Decomposition
├── Derive mini-loops: each is a unit whose DoD can flip green independently
├── Order by dependency; mark which may interleave
├── Setup/harness work is ALWAYS mini-loop L0 (env, verifier install, hooks, progress files)
├── Human-gated work: name the gate, define what flips it, and confirm the gate
│   blocks ONLY its own mini-loop — siblings proceed
└── Anything strategy-tier inside an execution phase (design specs, gold checks)
    is marked as a pre-scheduled planner-tier escalation, not loop-orchestrated work
```

### Stage 4: Authoring

Write the loop from `templates/LOOP-template.md` with `references/loop-anatomy.md`
open. The non-negotiables (verbatim in every generated loop):

1. **Layering rule** — programmatic checks decide "done"; a model reviewer may
   add blockers but never overrides a failing programmatic check.
2. **Test/eval immutability** — the project's test or eval suite is the loop's
   "tests"; editing it to pass is forbidden and the rule is hooks-enforced, not prose.
3. **Mission record read-only** — LOOP.md, decision logs, and scope docs are
   read-only to the loop; only planner/owner sessions edit them.
4. **Escalation protocol** — maker ≤2 rebuttals per verifier finding, then
   escalate per the routing reference; every escalation logged in PROGRESS.md.
5. **Default-FAIL evidence gate** — DoD status lives in `dod-status.json`
   (L0 initializes every item false); flips are hook-gated on evidence reads
   (`templates/hooks/`). Deterministic over behavioral: a rule a hook can
   enforce is never left as prose — on the claim side as well as the write side.
6. **Runner discipline** — every mini-loop carries a `GOAL:` line (a valid
   /goal condition per `references/goal-runner.md`); MACHINERY names the
   runner (one fresh session per mini-loop, driven by /goal) and the fallback
   ladder for harnesses without it.

### Stage 5: Self-verification

Run `references/loop-anatomy.md` §Self-check against the draft. Typical failures:
a DoD item no command can check, a gate that silently blocks sibling loops, a
forbidden-list entry no hook could implement, spend guardrails with no ledger to
read them from.

### Stage 6: Emit

Default output path: `loops/<phase-or-wp-slug>/LOOP.md` in the target project
(`--out` overrides). Summarize: mini-loops + dependency shape, gates and their
owners, spend envelopes, verifier wiring, and any open questions parked for the
owner. Do not create PROGRESS.md — that is the loop's own L0 job.

---

## Error Handling

| Scenario | Action |
|----------|--------|
| No decision log found | AskUserQuestion: routing ladder + guardrails become explicit inputs; note "no decision log" in the loop header |
| Scope doc contradicts decision log | Log wins; discrepancy reported to the user before emit |
| WP YAML lacks acceptance criteria (transform mode) | STOP — return the gap; a loop cannot invent its own DoD |
| Batch: a sub-agent's loop fails spot-check | Re-spawn once with the failure named; second failure → author that one directly |
| Target LOOP.md already exists | AskUserQuestion before overwriting; offer add-mini-loop mode |

---

## Diagnostic Output

After every invocation append one dated entry to
`<target-project>/logs/loop-generator.log.md` (create if absent; scratchpad if
the project has no logs/ convention): mode, inputs read, mini-loop count, gates,
calibration choices, open questions. One entry per run — this is the audit trail
for "why does this loop look the way it does."

---

## Related

- `examples/example-phase-loop.md` — complete worked example (strategy mode),
  self-contained
- Built-in `/loop` skill — UNRELATED (recurring task execution, not loop authoring)
- Built-in `/goal` command — the house-preferred RUNNER for generated
  mini-loops (this skill authors the spec; /goal drives one mini-loop to
  green). See `references/goal-runner.md`.
- Lineage for the v1.2 evidence gate + runner integration: Anthropic's
  long-running-agents patterns (github.com/anthropics/cwc-long-running-agents)
  and the /goal docs (code.claude.com/docs/en/goal).
