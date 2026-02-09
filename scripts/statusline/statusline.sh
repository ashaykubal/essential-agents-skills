#!/bin/bash
# Claude Code Status Line
# Displays multi-line status with context gauge, model info, and git status

set -euo pipefail

# === Color Definitions (RGB for exact hex colors) ===
# Foreground: \033[38;2;R;G;Bm  Background: \033[48;2;R;G;Bm
RESET='\033[0m'

# Gauge colors
GAUGE_LOW='\033[38;2;175;255;175m'      # #AFFFAF pastel green
GAUGE_MID='\033[38;2;255;244;176m'      # #FFF4B0 pastel yellow
GAUGE_HIGH='\033[38;2;255;154;150m'     # #FF9A96 pastel coral
GAUGE_EMPTY='\033[38;2;88;88;88m'       # #585858 dim gray

# Model background colors (with dark foreground for contrast)
MODEL_FG='\033[38;2;30;30;30m'          # Dark text on pastel bg
MODEL_OPUS='\033[48;2;196;173;237m'     # #C4ADED soft purple
MODEL_SONNET='\033[48;2;172;213;243m'   # #ACD5F3 soft blue
MODEL_HAIKU='\033[48;2;172;239;214m'    # #ACEFD6 soft teal

# Segment colors
LABEL='\033[38;2;138;138;138m'          # #8A8A8A medium gray
FILE_PATH='\033[38;2;255;215;175m'      # #FFD7AF pastel peach
GIT_BRANCH='\033[38;2;135;215;255m'     # #87D7FF pastel cyan

# === Read JSON from stdin ===
INPUT=$(cat)

# === Parse JSON with jq ===
MODEL=$(echo "$INPUT" | jq -r '.model.display_name // "Unknown"')
PERCENT=$(echo "$INPUT" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
CONTEXT_SIZE=$(echo "$INPUT" | jq -r '.context_window.context_window_size // 200000')
# Calculate tokens from percentage (total_input/output_tokens includes sub-agents)
PERCENT_RAW=$(echo "$INPUT" | jq -r '.context_window.used_percentage // 0')
COST=$(echo "$INPUT" | jq -r '.cost.total_cost_usd // 0')
CWD=$(echo "$INPUT" | jq -r '.workspace.current_dir // ""')

# === Calculate tokens from percentage ===
# tokens_used = (percentage / 100) * context_window_size
TOTAL_TOKENS=$(echo "$PERCENT_RAW $CONTEXT_SIZE" | awk '{printf "%.0f", ($1 / 100) * $2}')

# Format tokens (K/M suffix)
format_tokens() {
    local tokens=$1
    if [ "$tokens" -ge 1000000 ]; then
        echo "$((tokens / 1000000))M"
    elif [ "$tokens" -ge 1000 ]; then
        echo "$((tokens / 1000))K"
    else
        echo "$tokens"
    fi
}

TOKENS_USED=$(format_tokens $TOTAL_TOKENS)
TOKENS_MAX=$(format_tokens $CONTEXT_SIZE)

# Format cost
COST_FMT=$(printf "\$%.2f" "$COST")

# === Build gauge ===
GAUGE_WIDTH=10
FILLED=$((PERCENT * GAUGE_WIDTH / 100))
[ "$FILLED" -gt "$GAUGE_WIDTH" ] && FILLED=$GAUGE_WIDTH
EMPTY=$((GAUGE_WIDTH - FILLED))

# Select gauge color based on threshold
if [ "$PERCENT" -lt 60 ]; then
    GAUGE_COLOR="$GAUGE_LOW"
elif [ "$PERCENT" -lt 70 ]; then
    GAUGE_COLOR="$GAUGE_MID"
else
    GAUGE_COLOR="$GAUGE_HIGH"
fi

# Build gauge string
GAUGE=""
for ((i=0; i<FILLED; i++)); do
    GAUGE="${GAUGE}▰"
done
GAUGE_EMPTY_STR=""
for ((i=0; i<EMPTY; i++)); do
    GAUGE_EMPTY_STR="${GAUGE_EMPTY_STR}▱"
done

# === Select model background color ===
case "$MODEL" in
    *Opus*|*opus*)
        MODEL_BG="$MODEL_OPUS"
        ;;
    *Sonnet*|*sonnet*)
        MODEL_BG="$MODEL_SONNET"
        ;;
    *Haiku*|*haiku*)
        MODEL_BG="$MODEL_HAIKU"
        ;;
    *)
        MODEL_BG="$MODEL_SONNET"  # Default to Sonnet color
        ;;
esac

# === Get git info ===
GIT_REPO=""
GIT_BRANCH_NAME=""
GIT_PENDING=0

if [ -n "$CWD" ] && [ -d "$CWD" ]; then
    cd "$CWD" 2>/dev/null || true
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        GIT_REPO=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "")
        GIT_BRANCH_NAME=$(git branch --show-current 2>/dev/null || echo "")
        GIT_PENDING=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    fi
fi

# === Get last modified file (most recent by mtime) ===
LAST_FILE=""
if [ -n "$CWD" ] && [ -d "$CWD" ]; then
    cd "$CWD" 2>/dev/null || true
    # Combine: modified tracked files + untracked files, sort by mtime
    LAST_FILE=$( (git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null) | \
        xargs -I{} sh -c '[ -f "{}" ] && stat --format="%Y %n" "{}"' 2>/dev/null | \
        sort -rn | head -1 | cut -d' ' -f2- || true)
fi

# === Output Lines ===

# Line 1: Model + Gauge + Tokens (percentage matches gauge color)
echo -e "${MODEL_BG}${MODEL_FG} ${MODEL} ${RESET}  ${GAUGE_COLOR}${GAUGE}${RESET}${GAUGE_EMPTY}${GAUGE_EMPTY_STR}${RESET} ${GAUGE_COLOR}${PERCENT}%${RESET} (${TOKENS_USED}/${TOKENS_MAX})"

# Line 2: Last file (if available)
if [ -n "$LAST_FILE" ]; then
    echo -e "${LABEL}Last file:${RESET} ${FILE_PATH}${LAST_FILE}${RESET}"
fi

# Line 3: Git info (if available)
if [ -n "$GIT_REPO" ] && [ -n "$GIT_BRANCH_NAME" ]; then
    PENDING_TEXT=""
    if [ "$GIT_PENDING" -gt 0 ]; then
        PENDING_TEXT=" ${LABEL}(${GIT_PENDING} files pending)${RESET}"
    fi
    echo -e "${LABEL}Git:${RESET} ${GIT_BRANCH}${GIT_REPO}/${GIT_BRANCH_NAME}${RESET}${PENDING_TEXT}"
fi
