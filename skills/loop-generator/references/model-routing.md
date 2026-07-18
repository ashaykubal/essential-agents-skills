# Model routing — the operating-model block

Every loop carries an operating-model block wired to the project's routing
decision. Find that decision in the project's decision log first (it may be a
numbered decision entry or part of the mission's operating rules — search for
routing/model/orchestration language). If the project has no routing decision,
obtain one via AskUserQuestion — do not invent one silently.

## The house default (owner policy, confirmed 2026-07-18)

Fable-class usage is subscription-capped at 50% of other models and economized
across ALL projects. Therefore:

| Tier | Role in a loop |
|---|---|
| **Fable** | NEVER orchestrates execution. Strategy only: loop authoring, design specs, adversarial gold checks, escalation arbitration — each pre-scheduled or trigger-bound |
| **Opus** | Orchestrates the loop; implements complex work |
| **Sonnet** | Moderate/mechanical tasks (fixture harnesses, labeling, transforms) |
| **Haiku** | Lookups, search, classification-scale calls |
| **Codex** (OpenAI, owner's ChatGPT Plus) | Cross-model verification — `codex exec review --json`, read-only sandbox (bubblewrap on WSL2) |

Dev-time agents run on subscription; application-runtime LLM calls go through
the project's cost-ledger gateway where one exists. Carry the project's
billing/key-isolation constraints into the loop verbatim (some projects forbid
the canonical API-key env name entirely — check the decision log).

## Fable escalation triggers (enumerate in the loop — bounded, logged)

1. Ambiguity that would change a schema or architecture decision.
2. Maker-vs-verifier disagreement surviving the rebuttal cap.
3. Pre-scheduled strategy items embedded in the phase (design specs, eval-gold
   adversarial checks) — the orchestrator schedules these, never attempts them.
4. Owner-gate adjudication prep (assembling the decision packet).

Every escalation is logged in PROGRESS.md with trigger + outcome. An unlogged
escalation is a protocol violation; an orchestrator quietly doing Fable-tier
design work is a worse one.

## The layering rule (verbatim in every loop)

> Programmatic checks decide "done". A model reviewer may add blockers; it may
> NEVER override a failing programmatic check.

Corollary: a passing review never substitutes for a failing test, and "the
verifier liked it" appears in no DoD.

## Disagreement protocol

Maker gets ≤2 rebuttal rounds per verifier finding. Unresolved → Fable
arbitration → owner ledger. Every finding is fixed or disposed with a reason in
the progress file — no silent drops, no infinite negotiation.

## Verifier placement

- Cross-model review at every mini-loop exit (cheap on the owner's Plus plan).
- MANDATORY (non-waivable, named in the loop) on the highest-blast-radius
  mini-loop — the one guarding the phase's one-way door.
- L0 always smoke-tests the verifier on a planted defect before any real work:
  a verifier that has never caught anything is an assumption, not a layer.
