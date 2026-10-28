<#
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#>
# job autopilot setup (windows): playwright mcp + chromium in ~\.job-autopilot, mcp servers in claude code / codex, opens chromium
# usage: powershell -ExecutionPolicy Bypass -File setup.ps1 [-NoBrowser]     safe to re-run
param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'

$App = if ($env:JOB_AUTOPILOT_HOME) { $env:JOB_AUTOPILOT_HOME } else { Join-Path $HOME '.job-autopilot' }
$Skill = Split-Path $PSScriptRoot -Parent
$McpVer = '0.0.83'
$FreehireUrl = 'https://freehire.me/api/v1/mcp'
function Say($m) { Write-Host "> $m" -ForegroundColor Cyan }
function Has($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }

# node 18+
if (-not (Has node)) { throw 'Node.js 18 or newer is required: https://nodejs.org' }
$node = (Get-Command node).Source
if ([int](& $node -p 'parseInt(process.versions.node)') -lt 18) { throw "Node.js 18 or newer is required (found $(& $node -v))" }

'browser-profile', 'screenshots', 'letters' | ForEach-Object { New-Item -ItemType Directory -Force -Path (Join-Path $App $_) | Out-Null }
$pkg = Join-Path $App 'package.json'
if (-not (Test-Path $pkg)) { Set-Content -Path $pkg -Value '{ "private": true }' -Encoding ascii }

Say "Installing the browser driver (Playwright MCP $McpVer) into $App"
& npm install --prefix $App --no-audit --no-fund --loglevel=error "@playwright/mcp@$McpVer"
if ($LASTEXITCODE) { throw 'npm install failed' }

Say 'Downloading Chromium'
& (Join-Path $App 'node_modules\.bin\playwright.cmd') install chromium
if ($LASTEXITCODE) { throw 'Chromium download failed' }

$prof = Join-Path $App 'profile.md'
if (-not (Test-Path $prof)) { Copy-Item (Join-Path $Skill 'templates\profile.example.md') $prof; Say "Profile template created: $prof" }

$cli = Join-Path $App 'node_modules\@playwright\mcp\cli.js'
$browser = @('--', $node, $cli, '--browser', 'chromium', '--user-data-dir', (Join-Path $App 'browser-profile'), '--output-dir', (Join-Path $App 'screenshots'))
$found = $false

if (Has claude) {
  $found = $true
  Say 'Registering MCP servers in Claude Code (user scope)'
  & claude mcp get freehire *> $null
  if ($LASTEXITCODE) { & claude mcp add -s user -t http freehire $FreehireUrl }
  & claude mcp remove -s user job-browser *> $null
  & claude mcp add -s user job-browser @browser
}

if (Has codex) {
  $found = $true
  Say 'Registering MCP servers in Codex'
  & codex mcp get freehire *> $null
  if ($LASTEXITCODE) { & codex mcp add freehire --url $FreehireUrl }
  & codex mcp remove job-browser *> $null
  & codex mcp add job-browser @browser
}

if (-not $found) { Say 'Claude Code or Codex not found on PATH. Install one, then run this script again to register the MCP servers.' }

if (-not $NoBrowser) {
  Say 'Opening Chromium (close it when you are done signing in)'
  Start-Process -FilePath $node -ArgumentList "`"$(Join-Path $Skill 'scripts\open-browser.mjs')`"" -WindowStyle Hidden
}

Write-Host @"

Job Autopilot is installed.

  1. In the Chromium window: sign in to any job sites you use (optional), then CLOSE the window.
  2. Restart Claude Code or Codex so they load the new MCP servers.
  3. Ask:  /job-autopilot apply to remote React developer jobs in Europe
     (Codex: `$job-autopilot ... or just ask in plain words)

The first run asks a few questions and saves them to $prof.
"@
