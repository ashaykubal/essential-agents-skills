# Worked example — strategy-mode phase loop

<!-- This is a real generated loop from a personal knowledge-pipeline project
     (Phase 1: harden content extractors, then extract a ~2,100-message corpus
     to a staging store). It is included VERBATIM in structure and voice; only
     external references have been inlined so the example is self-contained.
     Decision ids (D5, D9, D11, …) refer to THAT project's decision log — your
     target project will have its own log and its own ids.
     Things to notice:
     - L0 is always harness setup, and smoke-tests the verifier on a planted defect
     - every DoD item is command/test/score-checkable; thresholds cite sources
     - gates block only their own mini-loops; siblings proceed
     - the forbidden list is written so each entry maps to a PreToolUse hook
     - strategy-tier items (L3's gold check) are pre-scheduled planner escalations,
       not orchestrator work -->

# Phase 1 LOOP — extraction hardening + full-corpus staging

Authored by the planner-tier model 2026-07-18 (house style). Orchestrated by an
Opus-class model per the project's routing decision. This file and the decision
log are READ-ONLY to the loop — only planner/owner sessions edit them.

GOAL
  Every corpus message (2,125 msgs / 1,323 unique URLs) triaged and its content
  extracted into a validated staging store; extractors hardened against the
  prior phase's bug list; the second chat export (WITH media, 118 PDFs) merged;
  the depth-eval suite authored and baselined. Staging is raw extracted content
  (episodes), NOT graph rows — engine ingest waits for the next phase's design gate.

## Operating model

- **Orchestrator: Opus.** Routes tasks: Opus = complex implementation · Sonnet =
  moderate tasks · Haiku = lookups/search and classification-scale calls ·
  **Codex** (`codex exec review --json`, read-only sandbox) = cross-model review
  at every mini-loop exit.
- **Planner tier (Fable) = escalation only**: (a) ambiguity that would change a
  schema or architecture decision, (b) maker-vs-Codex disagreement surviving 2
  rebuttal rounds, (c) the pre-scheduled eval-gold adversarial check (L3),
  (d) owner-gate adjudication prep. Log every escalation in PROGRESS.md.
- **Layering rule: programmatic checks decide "done".** A model reviewer may add
  blockers; it may NEVER override a failing programmatic check.
- Dev-time agents run on subscription; runtime LLM calls go through the
  project's cost-ledger gateway — no exceptions.

## GATES (owner attestations — a gated mini-loop does not start; others proceed)

- [ ] **G1**: chat re-export WITH media delivered (blocks L4)
- [x] **G2**: depth-eval suite approved — logged decision, 2026-07-18 (L3 unblocked)
- [ ] **G3**: paywalled-source session credentials in the secrets store (D5) —
      blocks *paywalled-post* extraction only; public-API fixes and fixture
      tests proceed without it

## Mini-loops (dependency order; git commit per green exit; per-loop progress file)

### L0 — Harness setup  (deps: none)
1. **Fast-filesystem hot paths**: create `~/kb-hot/{engines,venvs,db,staging}`
   on the Linux FS; symlink into the repo; confirm every symlinked path is
   gitignored (repo lives on a slow Windows mount; I/O-heavy paths move off it).
2. **Codex CLI**: install + auth + bubblewrap sandbox; smoke-test the
   maker/checker loop on a planted trivial defect.
3. **Hooks**: PreToolUse hooks enforcing the FORBIDDEN list below (exit 2 =
   block); probe each rule.
4. Initialize `loops/phase1/PROGRESS.md` (dated entries).
DoD (programmatic)
  - Codex smoke test returns ≥1 structured finding on the planted defect
  - hook probes BLOCK: a write under the eval-suite dir, a write mentioning the
    canonical API-key name, a write under the private-uploads dir
  - symlinked paths resolve from the repo; `git status` clean of hot-path files
  - the engine answers one known eval question end-to-end (environment proof)

### L1 — Extractor hardening (per-source)  (deps: L0)
Sources: the prior phase's bug notes + per-source research docs.
1. **Substack** (Opus): parse `<handle>` from the `/pub/<handle>/` URL path and
   call the API host directly (redirect-derived hosts 404'd in 12/16 attempts);
   re-validate against the 12 failing URLs logged in the corpus report.
2. **Reddit** (Opus): removed/deleted-post detection; keep an episode iff the
   surviving comments carry knowledge; parse from the local HTML cache — NEVER
   live-fetch when a cache entry exists (login wall lands soon; cache is truth).
3. **Fixture suites** (Sonnet): per-source offline tests over cached fixtures;
   no network in unit tests.
DoD (programmatic)
  - all per-source fixture tests green, offline (network mocked/absent)
  - 12/12 prior substack failures now fetch content or are logged verifiably dead
  - removed-post fixtures: kept-with-comments and dropped-empty cases both pass
  - Codex review clean (2-rebuttal protocol)

### L2 — Triage classifier + annotation pairing  (deps: L0)
Haiku-tier classifier over raw messages via the gateway: {link, link-annotation,
note-worth-keeping, noise} + source-type routing. **Annotation pairing** (owner-
flagged; measured: 183 pairs, ~19.5% of recent links): a short URL-free message
adjacent to a link within ≤3 min binds to it as `owner_note`; never force-pair
(~80% of links have no note). Deterministic rule first; Haiku only for ambiguous
adjacency.
DoD (programmatic)
  - ≥90% agreement with a 100-message labeled sample (Sonnet labels, Opus
    spot-checks 20; disagreements adjudicated before scoring); sample includes
    ≥15 annotated-link pairs and ≥5 unannotated adjacencies (false-pair check)
  - pairing recall ≥95% vs the measurement probe's 183 pairs, disagreements
    adjudicated (the probe is a heuristic baseline, not gold)
  - full-corpus cost projection logged from measured per-call ledger entries

### L3 — Depth-eval suite  (deps: L0; gate G2 ✅)
1. Select 3–5 dense how-to sources from the corpus (owner annotations are a
   selection signal) — Sonnet shortlist, Opus picks.
2. Author per-source fact inventories (15–40 items each) — Opus.
3. **Planner-tier adversarial check** of the gold (pre-scheduled escalation;
   different model checks the author's work, corrections logged).
4. 4–6 how-to questions + scorer prompt; baseline-score the current engine.
DoD (programmatic)
  - gold + scorer committed WITH the check log; files fall under
    eval-immutability from commit
  - end-to-end scoring run completes; baseline recorded in PROGRESS.md

### L4 — Media export merge  (deps: L0; GATED G1)
Parse the new export; reconcile vs the old (old ⊂ new, deltas explained);
extract 118 PDFs to text (offline tooling first, LLM-assist via the gateway only
where parsing fails); merge with provenance.
DoD (programmatic)
  - reconciliation report: counts, overlaps, deltas — zero unexplained
  - 118/118 PDFs accounted: text extracted or logged unreadable-with-reason
  - merged corpus validates against the episode schema

### L5 — Full-corpus extraction to staging  (deps: L1, L2; folds in L4 if G1 has landed, else runs on the current corpus and L4 delta-extracts after)
Triage + extractors over the full corpus → staging JSONL on the fast-FS hot path
(episode: id, source_type, url, msg_date, fetch metadata, title, content,
`owner_note` nullable, extraction method/status). Batched + resumable;
residential IP required for bot-walled sources; per-batch ledger checkpoints.
DoD (programmatic)
  - every URL accounted for: extracted / dead / paywalled(G3) / noise — with reason
  - ≥95% of live, non-paywalled URLs yield content-bearing episodes
  - staging validates against the schema; 20 random episodes spot-checked
    against source cache (Sonnet) — zero content mismatches
  - spend within envelope; coverage report written; snapshot archived

GUARDRAILS
  max_iterations: 8 per mini-loop · stop_if_no_progress: 2 consecutive
    iterations without a DoD item flipping → record blocker, escalate
  spend: runtime LLM (L2 + L4 + L5) ≤ $10 total on the ledger; abort any batch
    at 2× its logged projection
  concurrency: ≤4 agents (16 GB WSL2 OOM rule)
  FORBIDDEN (hooks-enforced, not prose):
    - editing anything under the eval-suite dir — the eval suite is our
      "tests"; never edit tests to pass
    - private-uploads content written anywhere outside processing paths (D9)
    - the canonical API-key env name, anywhere (D11)
    - runtime LLM calls bypassing the gateway
    - editing loops/*/LOOP.md or the decision log from within the loop
    - live fetches for URLs present in the local cache manifest

MACHINERY
  memory:   loops/phase1/PROGRESS.md (+ per-mini-loop notes beside it)
  verifier: Codex at every mini-loop exit + programmatic DoD; disagreement:
            maker ≤2 rebuttals → planner-tier arbitration → owner ledger
  trigger:  owner starts a session; L0 first; L1/L2/L3 may interleave after L0;
            L5 closes the phase (with or without L4 per its gate note)
  exit:     all mini-loop DoDs green (L4 may remain open on G1 — then the phase
            closes provisionally and L4+delta-L5 run as a coda when G1 lands)
