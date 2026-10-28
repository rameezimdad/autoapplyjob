#!/usr/bin/env bash
# Developed by Mohammad Rameez Imdad (Rameez Scripts)
# WhatsApp: https://wa.me/923435347417 (For Custom Projects)
# YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#
# job autopilot setup: playwright mcp + chromium in ~/.job-autopilot, mcp servers in claude code / codex, opens chromium
# usage: bash setup.sh [--no-browser] [--headless] [--doctor]     safe to re-run
set -euo pipefail

APP="$HOME/.job-autopilot"
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_VER=0.0.83
YAML_VER=2.9.1
FREEHIRE_URL=https://freehire.me/api/v1/mcp
OPEN=1 HEADLESS=0 DOCTOR=0
for a in "$@"; do
  case "$a" in
    --no-browser) OPEN=0 ;;
    --headless) HEADLESS=1 OPEN=0 ;;
    --doctor) DOCTOR=1 ;;
  esac
done

say() { printf '\033[1;34m>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mx\033[0m %s\n' "$*" >&2; exit 1; }
# codex starts an oauth sign-in right after adding an http server: never let it block setup
capped() { "$@" </dev/null >/dev/null 2>&1 & local p=$! i=0; while kill -0 "$p" 2>/dev/null && [ "$i" -lt 20 ]; do sleep 1; i=$((i + 1)); done; kill "$p" 2>/dev/null || true; wait "$p" 2>/dev/null || true; }

# node 18+
NODE="$(command -v node || true)"
[ -n "$NODE" ] || die "Node.js 18 or newer is required: https://nodejs.org"
[ "$("$NODE" -p 'parseInt(process.versions.node)')" -ge 18 ] || die "Node.js 18 or newer is required (found $("$NODE" -v))"
JA="$SKILL/scripts/ja.mjs"
[ "$DOCTOR" = 1 ] && exec "$NODE" "$JA" doctor
command -v npm >/dev/null || die "npm is required (it ships with Node.js)"

mkdir -p "$APP/browser-profile" "$APP/screenshots" "$APP/recipes"
[ -f "$APP/package.json" ] || echo '{ "private": true }' > "$APP/package.json"

say "Installing Playwright MCP $MCP_VER and yaml $YAML_VER into $APP"
npm install --prefix "$APP" --no-audit --no-fund --loglevel=error "@playwright/mcp@$MCP_VER" "yaml@$YAML_VER"

say "Downloading Chromium"
"$APP/node_modules/.bin/playwright" install chromium

# form filler, injected into every page the agent opens
cp "$SKILL/scripts/recipes/fill.js" "$APP/recipes/fill.js"

if [ ! -f "$APP/profile.yaml" ]; then
  cp "$SKILL/templates/profile.example.yaml" "$APP/profile.yaml"
  say "Profile template created: $APP/profile.yaml"
  [ -f "$APP/profile.md" ] && say "An older profile.md is there too: ask your agent to move it into profile.yaml"
fi

CLI="$APP/node_modules/@playwright/mcp/cli.js"
BROWSER=("$NODE" "$CLI" --browser chromium --user-data-dir "$APP/browser-profile" --output-dir "$APP/screenshots" --snapshot-mode none --image-responses omit --init-script "$APP/recipes/fill.js")
[ "$HEADLESS" = 1 ] && BROWSER+=(--headless)
found=0

if command -v claude >/dev/null; then
  found=1
  say "Registering MCP servers in Claude Code (user scope)"
  claude mcp get freehire >/dev/null 2>&1 || claude mcp add -s user -t http freehire "$FREEHIRE_URL"
  claude mcp remove -s user job-browser >/dev/null 2>&1 || true
  claude mcp add -s user job-browser -- "${BROWSER[@]}"
fi

if command -v codex >/dev/null; then
  found=1
  say "Registering MCP servers in Codex"
  if ! codex mcp get freehire >/dev/null 2>&1; then
    capped codex mcp add freehire --url "$FREEHIRE_URL"
    codex mcp get freehire >/dev/null 2>&1 && say "Codex: if freehire asks you to sign in, run once: codex mcp login freehire"
  fi
  codex mcp remove job-browser >/dev/null 2>&1 || true
  codex mcp add job-browser -- "${BROWSER[@]}"
fi

[ "$found" = 1 ] || say "Claude Code or Codex not found on PATH. Install one, then run this script again to register the MCP servers."

# gui check: macOS, or a linux display (WSLg counts)
if [ "$OPEN" = 1 ] && { [ "$(uname)" = Darwin ] || [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; }; then
  say "Opening Chromium (close it when you are done signing in)"
  nohup "$NODE" "$SKILL/scripts/open-browser.mjs" >"$APP/browser.log" 2>&1 &
elif [ "$OPEN" = 1 ]; then
  say "No display found, skipping the browser window (use --headless on servers)."
fi

say "Checking the install"
"$NODE" "$JA" doctor || true

cat <<EOF

Job Autopilot is installed.

  1. In the Chromium window: sign in to any job sites you use (optional), then CLOSE the window.
  2. Restart Claude Code or Codex so they load the new MCP servers.
  3. Ask:  /job-autopilot apply to remote React developer jobs in Europe
     (Codex: \$job-autopilot ... or just ask in plain words)

The first run asks a few questions and saves them to $APP/profile.yaml.
Health check any time: bash "$SKILL/scripts/setup.sh" --doctor
EOF
