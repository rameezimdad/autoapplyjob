#!/usr/bin/env bash
# Developed by Mohammad Rameez Imdad (Rameez Scripts)
# WhatsApp: https://wa.me/923435347417 (For Custom Projects)
# YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#
# job autopilot installer (macOS / Linux / WSL)
#   curl -fsSL https://raw.githubusercontent.com/rameezimdad/autoapplyjob/main/install.sh | bash
#   or from a clone: ./install.sh [--no-browser]
set -euo pipefail

REPO=https://github.com/rameezimdad/autoapplyjob
APP="${JOB_AUTOPILOT_HOME:-$HOME/.job-autopilot}"
here="$(cd "$(dirname "${BASH_SOURCE[0]:-.}")" 2>/dev/null && pwd || pwd)"

# piped from curl = no checkout, fetch one
if [ ! -f "$here/skills/job-autopilot/SKILL.md" ]; then
  command -v git >/dev/null || { echo "git is required: https://git-scm.com" >&2; exit 1; }
  mkdir -p "$APP"
  if [ -d "$APP/repo/.git" ]; then git -C "$APP/repo" pull -q --ff-only; else git clone -q --depth 1 "$REPO" "$APP/repo"; fi
  here="$APP/repo"
fi
SRC="$here/skills/job-autopilot"

# skill dirs: claude code + codex (and other agents that read ~/.agents/skills)
targets=()
{ command -v claude >/dev/null || [ -d "$HOME/.claude" ]; } && targets+=("$HOME/.claude/skills")
{ command -v codex >/dev/null || [ -d "$HOME/.codex" ]; } && targets+=("$HOME/.agents/skills")
[ ${#targets[@]} -gt 0 ] || targets=("$HOME/.claude/skills" "$HOME/.agents/skills")

for d in "${targets[@]}"; do
  mkdir -p "$d"
  rm -rf "${d:?}/job-autopilot"
  ln -s "$SRC" "$d/job-autopilot"  # symlink, so git pull updates it
  printf '\033[1;34m>\033[0m Skill linked: %s\n' "$d/job-autopilot"
done

bash "$SRC/scripts/setup.sh" "$@"
