# {Phase/WP name} LOOP — {one-line outcome}

<!-- Authored by {model} {date} ({mode} mode via loop-generator).
     Calibration: blast radius {LOW/MED/HIGH}, coordination {LOW/MED/HIGH};
     adopted: {…}; consciously skipped: {…}.
     This file and {decision log path} are READ-ONLY to the loop — only
     planner/owner sessions edit them. -->

GOAL
  {What is TRUE when this closes — falsifiable, cites its scope authority.
  Not a list of work; a state of the world.}

## Operating model ({routing decision id})

{Copy the project's canonical routing block VERBATIM if one exists in another
loop; else instantiate from references/model-routing.md: orchestrator tier, task
routing ladder, verifier + sandbox, Fable escalation triggers (enumerated,
logged), the layering rule, gateway/billing constraints.}

## GATES (owner attestations — a gated mini-loop does not start; siblings proceed)

- [ ] **G1**: {plain-language dependency} — flips when {owner-visible action};
      blocks {mini-loop ids}
- [x] **G2**: {pre-flipped gate} — {decision id}, {date}

## Mini-loops (dependency order; git commit per green exit; per-loop progress notes)

### L0 — Harness setup  (deps: none)
GOAL: {ready-to-paste /goal condition for L0 — see references/goal-runner.md}
1. {Environment work: hot paths, installs, restores}
2. {Verifier install + auth; smoke test on a PLANTED defect}
3. {PreToolUse hooks for the FORBIDDEN list; probe each rule}
4. Evidence-gate hooks (default-FAIL contract): copy/adapt the skill's
   templates/hooks/* into {project}/.claude/hooks/ + settings; initialize
   {loop dir}/dod-status.json (EVERY DoD item below, all false) and
   {loop dir}/evidence/; gitignore .claude/.evidence-reads.
5. Initialize {progress file path}.
DoD (programmatic)
  - verifier smoke test returns ≥1 structured finding on the planted defect
  - hook probes BLOCK: {one probe per forbidden rule}
  - evidence-gate probe: dod-status.json flip WITHOUT an evidence read →
    BLOCKED; after reading an evidence file → allowed
  - {environment proof: the system runs one real operation end-to-end}

### L1 — {name}  (deps: L0{, gates})
GOAL: {the L1 /goal condition: DoD as transcript-verifiable claims · outputs
  shown in-conversation and tee'd to evidence/ · verifier verdict pasted ·
  turn bound from GUARDRAILS}
{Ordered tasks, with model-routing hints where non-obvious. Strategy-tier items
are marked "Fable escalation (pre-scheduled)" — the orchestrator schedules them.}
DoD (programmatic — each check tees its output to {loop dir}/evidence/)
  - {command/test/score-checkable item — threshold cites its source}
  - {…}
  - verifier review clean (≤2-rebuttal protocol)

### L{N} — {the phase-closing loop}  (deps: {…}; GATED {Gx} if one-way)
GOAL: {the L{N} /goal condition}
{The expensive/irreversible step goes LAST, behind its gate, with checkpointed
abort conditions and a mid-run probe cadence.}
DoD (programmatic)
  - {completion report with counts vs projections}
  - {post-step smoke checks}
  - {snapshot/archive written}

GUARDRAILS
  max_iterations: {n} per mini-loop · stop_if_no_progress: {n} → blocker + escalate
  spend: {envelope} on {ledger path}; abort at {multiplier}× logged projection
  concurrency: {cap} ({source of the rule})
  FORBIDDEN (hooks-enforced, not prose — every entry hook-implementable):
    - editing {test/eval suite path} — never edit tests/gold to pass
    - {privacy/billing rules from the decision log}
    - editing {this LOOP, decision log} from within the loop
    - {project-specific: gateway bypass, cache bypass, …}

MACHINERY
  memory:   {progress file path} (dated entries; created by L0) +
            {loop dir}/dod-status.json (default-FAIL: L0 initializes all-false;
            flips evidence-gated by hooks — PROGRESS narrates, status decides)
  runner:   one mini-loop = one FRESH session; set that loop's GOAL line via
            /goal (Claude Code ≥2.1.139). Fallback ladder (goal-runner.md):
            Stop hook with the same condition → plain orchestrator iteration.
  verifier: {cross-model reviewer} at every exit (MANDATORY at L{x} — the
            one-way-door guard) + programmatic DoD; maker ≤2 rebuttals →
            {planner tier} → owner ledger
  trigger:  {who starts it; what runs first; what may interleave}
  exit:     {closing state; provisional-close rule for open-gated loops if any}
