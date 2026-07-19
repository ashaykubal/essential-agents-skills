# Rigor calibration — sizing the harness to the blast radius

Rigor is machinery against specific enemies, not a quality signal. Adopting
consumer-launch apparatus for a small personal project is the same defect as
skipping gates on a consumer launch — machinery unfit for the mission. Calibrate before
authoring; record the calibration in the loop's header comment.

## Classify the work

**Blast radius** — what happens when this goes wrong?
- LOW: reversible; single owner; data re-derivable (cached sources, staging kept
  raw); worst case is wasted tokens.
- MEDIUM: an expensive one-way step exists (a paid backfill, a published API) but
  is identifiable and gateable.
- HIGH: real users, payments, health/PII data, app-store or legal exposure,
  irreversible external actions.

**Coordination surface** — how many contexts must stay consistent?
- LOW: one repo, one planner, a handful of stable docs.
- MEDIUM: several agents/floors touching shared state.
- HIGH: multiple floors (plan/design/implementation), dozens of WPs line-citing
  living documents, parallel human review tracks.

## The adopt/skip matrix

**Always adopt (any scale — these are cheap and load-bearing):**
- Mini-loops with per-item programmatic DoD, commit-per-green-exit
- L0 harness setup with verifier smoke test on a planted defect
- Hooks-enforced forbidden list (test/eval immutability above all)
- Default-FAIL DoD status (dod-status.json all-false at L0) with the
  evidence-gate hook chain — the claim side enforced deterministically, not
  behaviorally (templates/hooks/)
- One fresh session per mini-loop, driven by /goal where available
  (loop-anatomy §Runner; goal-runner.md)
- Layered verification: programmatic decides, cross-model reviewer on top
- Mission-record read-only; escalation protocol with a rebuttal cap
- GATES block for human dependencies (checkboxes, flip actions)

**Adopt at MEDIUM+ blast radius:**
- Mandatory cross-model review on the highest-blast-radius mini-loop
  (the code whose silent failure corrupts the expensive step)
- Spend-gated entry to the one-way step (owner re-approves the projected number)
- Independent re-derivation of any score/tally that ratifies a phase
- Kill-switch + steering files (halt-on-sentinel-file and STEER.md hooks) for
  any run intended to go UNATTENDED
- Browser-verified evaluation (the reviewer drives the running app, not
  screenshots) when the surface under change is a UI

**Adopt at HIGH blast radius / HIGH coordination only:**
- WP YAML apparatus with verbatim scope transcription + out-of-scope fences
- Falsifiable estimate arithmetic (LOC bases, cushions, band ceilings)
- Line-citation discipline + drift-check rituals + mechanical citation verifiers
- gates.yaml as a machine-checked registry with programmatic probes
- Append-only amendment registers with consequence sweeps

**Re-simplify on model upgrades (standing discipline):** harness complexity is
debt indexed to the weakest model that must run the loop. After each major
model release, disable harness pieces (extra probes, rebuttal rounds, review
layers) in a LOW-blast-radius loop and observe what actually regresses; keep
only what is still load-bearing. Never re-simplify the evidence gate or the
forbidden-list hooks — determinism is not model-indexed.

**Skip-signals (you are over-engineering):**
- The gates registry has fewer than ~5 entries → a GATES checklist block suffices
- Estimates exist but nobody adjudicates budgets against them → drop arithmetic
- Citations point at docs that rarely change → cite section anchors, re-read
  authorities at loop start instead
- The verification apparatus costs more than re-running the work it protects

## A worked contrast — same owner, opposite calibrations, both correct

Two real missions under this same house pattern:
- **A consumer-grade product** (HIGH blast radius / HIGH coordination: real
  users, payments, health data, app-store exposure, three coordinating floors,
  44 WPs): full apparatus — WP YAMLs with verbatim scope transcription,
  estimate arithmetic, a machine-checked gates registry, citation drift
  tooling, cross-model review on every increment.
- **A single-owner personal data pipeline** (LOW-MEDIUM: source data cached and
  re-derivable, staging kept raw, one gateable one-way step — a paid backfill):
  two LOOP.md files of mini-loops, GATES blocks, hooks, cross-model review at
  exits with MANDATORY review only on the logic guarding the paid step. WP
  apparatus consciously skipped.

The transferable rule: find the one-way door, put the heavyweight verification
directly in front of it, and keep everything else light.
