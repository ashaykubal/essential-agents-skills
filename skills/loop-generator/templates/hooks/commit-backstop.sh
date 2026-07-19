#!/usr/bin/env bash
# commit-backstop.sh — SessionEnd hook (use Stop on versions without SessionEnd)
# Preserves uncommitted loop work as a WIP commit at session end. Continuity
# insurance for the one-fresh-session-per-mini-loop discipline — NEVER a green
# exit. Green exits are explicit commits made when a mini-loop's DoD flips.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
[ -n "$(git status --porcelain 2>/dev/null)" ] || exit 0
git add -A >/dev/null 2>&1
git commit -q --no-verify \
  -m "WIP: session-end backstop — uncommitted loop work preserved (not a green exit)" \
  >/dev/null 2>&1
exit 0
