# Evidence-gate hook templates — the default-FAIL contract

Deterministic enforcement of the CLAIM side of a loop. The forbidden-list hooks
already guard bad *writes* (test tampering, gateway bypass); these guard false
*claims*: a DoD status flip is physically impossible without evidence produced
and read in the same session. Deterministic over behavioral — a rule a hook can
enforce is never left as prose. Lineage: anthropics/cwc-long-running-agents
(track-read.sh / verify-gate.sh / commit-on-stop.sh), adapted to the house
pattern.

| File | Event | Job |
|---|---|---|
| `track-evidence.sh` | PostToolUse (matcher: Read) | log reads of `evidence/` files to `.claude/.evidence-reads` |
| `gate-dod-status.sh` | PreToolUse (matcher: Write\|Edit) | DENY writes to `dod-status.json` unless evidence was read this session; reset the log on each allowed write (every flip needs fresh evidence) |
| `commit-backstop.sh` | Stop | rolling WIP-commit of uncommitted work at each turn end — continuity insurance, never a green exit |

Why `Stop` and not `SessionEnd` for the backstop: SessionEnd runs as the
process tears down — safe only for async fire-and-forget work (telemetry),
not for must-complete work like a commit — and it never fires on abrupt ends
(terminal kill, OOM), which are exactly what the backstop insures against.
Stop fires at every turn end, bounding loss to one turn; the rolling amend
keeps per-turn firing from littering history.
| `settings-snippet.json` | — | wiring example to merge into the project's `.claude/settings.json` |

## Install (the generated loop's L0 does this, then PROBES it)

1. Copy the three scripts to `<project>/.claude/hooks/`; `chmod +x` them.
2. Merge `settings-snippet.json` into the project's `.claude/settings.json`.
3. Adapt the variables at the top of each script (evidence dir pattern, status
   filename) to the generated loop's paths.
4. Add `.claude/.evidence-reads` to `.gitignore`.
5. **Probe** (this is an L0 DoD item, not optional): attempt a
   `dod-status.json` edit without reading evidence — must be BLOCKED. Read an
   evidence file, retry — must pass. An unprobed hook is a hope, not a
   guardrail.

## The contract these enforce

- L0 initializes `dod-status.json` with every DoD item `false` (default-FAIL:
  nothing is done until proven done — creation of the file is exempt from the
  gate, flips are not).
- Every DoD check tees its output into the loop's `evidence/` dir, e.g.
  `pytest -q 2>&1 | tee loops/<phase>/evidence/L1-tests.txt`.
- The agent must Read the evidence file (which is the point: look at the
  output), and only then can the status flip.
- PROGRESS.md narrates; `dod-status.json` decides.

The contract shape, not the filenames, is the requirement — adapt paths freely.
