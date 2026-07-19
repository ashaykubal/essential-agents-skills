#!/usr/bin/env bash
# commit-backstop.sh — Stop hook (fires at each turn end; also on clear/resume/compact).
# WHY Stop, not SessionEnd: SessionEnd runs as the process tears down — safe
# only for async fire-and-forget work (telemetry); must-COMPLETE work like a
# git commit belongs on Stop. SessionEnd also never fires on abrupt ends
# (terminal kill, OOM) — exactly the cases continuity insurance exists for.
# Stop bounds the loss to a single turn.
# Rolling WIP commit: consecutive backstop commits amend into one so per-turn
# firing doesn't litter history. NOTE: amend rewrites the WIP commit — fine for
# local-only repos; if the loop pushes WIP commits to a shared remote, drop the
# amend branch and always create a new commit. NEVER a green exit — green
# exits are explicit commits made when a mini-loop's DoD flips.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
[ -n "$(git status --porcelain 2>/dev/null)" ] || exit 0
git add -A >/dev/null 2>&1
if git log -1 --pretty=%s 2>/dev/null | grep -q '^WIP: turn-end backstop'; then
  git commit -q --no-verify --amend --no-edit >/dev/null 2>&1
else
  git commit -q --no-verify \
    -m "WIP: turn-end backstop — uncommitted loop work preserved (rolling; not a green exit)" \
    >/dev/null 2>&1
fi
exit 0
