#!/usr/bin/env bash
# Developed by Mohammad Rameez Imdad (Rameez Scripts)
# WhatsApp: https://wa.me/923435347417 (For Custom Projects)
# YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#
# agent-level eval: the real agent runs the skill in dry-run mode on the local demo forms
# needs: setup done, Claude Code logged in. usage: bash tests/e2e/run.sh [--keep]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALL="$HOME/.job-autopilot"
PORT="${PORT:-8787}"
T="$(mktemp -d)"
KEEP=0; [ "${1:-}" = --keep ] && KEEP=1

node "$ROOT/tests/serve.mjs" --port "$PORT" --hits "$T/hits.jsonl" > "$T/server.log" 2>&1 &
SRV=$!
cleanup() { kill "$SRV" 2>/dev/null || true; [ "$KEEP" = 1 ] || rm -rf "$T"; }
trap cleanup EXIT

# throwaway data home + demo profile + real pdf resume
export JOB_AUTOPILOT_HOME="$T/app"
mkdir -p "$JOB_AUTOPILOT_HOME"
cp "$ROOT/tests/fixtures/master-resume.test.md" "$T/master-resume.md"
sed -e "s#__TMP__#$T#g" -e "s#__PORT__#$PORT#g" "$ROOT/tests/fixtures/profile.test.yaml" > "$JOB_AUTOPILOT_HOME/profile.yaml"
node "$ROOT/skills/job-autopilot/scripts/ja.mjs" resume pdf "$T/master-resume.md" "$T/Demo-User-Resume.pdf" >/dev/null
sed "s#__PORT__#$PORT#g" "$ROOT/tests/fixtures/jobs.e2e.json" > "$T/jobs.json"

# isolated headless browser, same flags as setup
cat > "$T/mcp.json" <<EOF
{ "mcpServers": { "job-browser": { "command": "$(command -v node)", "args": [
  "$INSTALL/node_modules/@playwright/mcp/cli.js", "--browser", "chromium", "--headless", "--isolated",
  "--output-dir", "$JOB_AUTOPILOT_HOME/screenshots", "--snapshot-mode", "none", "--image-responses", "omit",
  "--init-script", "$INSTALL/recipes/fill.js" ] } } }
EOF

PROMPT="Use the job-autopilot skill. Dry run: apply to the jobs in $T/jobs.json (they are already chosen, skip the search). This is an automated test run, so do not ask me anything: decide on your own and finish with the report."
echo "e2e: running the agent (this takes a few minutes), work dir $T"
cd "$T"  # stray files land here, never in the repo
claude -p "$PROMPT" --mcp-config "$T/mcp.json" --strict-mcp-config \
  --allowedTools "Bash,Read,Write,Edit,Glob,Grep,Agent,Skill,TodoWrite,mcp__job-browser" \
  --output-format text > "$T/agent.txt" 2> "$T/agent.err" || echo "agent exited with $?"

node "$ROOT/tests/e2e/check.mjs" "$T"
