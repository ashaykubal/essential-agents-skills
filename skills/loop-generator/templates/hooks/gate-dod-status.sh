#!/usr/bin/env bash
# gate-dod-status.sh — PreToolUse hook (matcher: Write|Edit)
# Default-FAIL contract: a write to dod-status.json is DENIED unless evidence
# files were Read this session (tracked by track-evidence.sh). On an allowed
# write the evidence log resets, so every flip needs fresh evidence.
# Exit 2 = block; stderr is shown to the model. See hooks/README.md.

DOD_BASENAME='dod-status.json'  # adapt if the generated loop names it differently
STATE_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/.evidence-reads"

INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

case "$FILE_PATH" in
  *"$DOD_BASENAME")
    # Initialization is exempt: L0 creates the file (all items false) before
    # any flip is possible. Flips on an existing file are gated.
    if [ ! -f "$FILE_PATH" ]; then
      exit 0
    fi
    if [ -s "$STATE_FILE" ]; then
      : > "$STATE_FILE"   # reset — the next flip needs fresh evidence
      exit 0
    fi
    echo "BLOCKED (default-FAIL contract): flipping $DOD_BASENAME requires evidence read this session. Run the DoD check, tee its output into the loop's evidence/ dir, Read that file, then update the status." >&2
    exit 2
    ;;
esac
exit 0
