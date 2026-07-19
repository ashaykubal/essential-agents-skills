#!/usr/bin/env bash
# track-evidence.sh — PostToolUse hook (matcher: Read)
# Logs reads of evidence files so gate-dod-status.sh can require them before a
# DoD status flip. Part of the default-FAIL contract (see hooks/README.md).
# Adapt EVIDENCE_PATTERN to the generated loop's evidence dir.

EVIDENCE_PATTERN='/evidence/'   # substring matched against the Read file path
STATE_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/.evidence-reads"

INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

case "$FILE_PATH" in
  *"$EVIDENCE_PATTERN"*)
    mkdir -p "$(dirname "$STATE_FILE")"
    printf '%s\n' "$FILE_PATH" >> "$STATE_FILE"
    ;;
esac
exit 0
