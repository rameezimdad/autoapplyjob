<#
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#>
# job autopilot setup (windows): playwright mcp + chromium in ~\.job-autopilot, mcp servers in claude code / codex, opens chromium
# usage: powershell -ExecutionPolicy Bypass -File setup.ps1 [-NoBrowser] [-Headless] [-Doctor]     safe to re-run
param([switch]$NoBrowser, [switch]$Headless, [switch]$Doctor)
$ErrorActionPreference = 'Stop'

$App = Join-Path $HOME '.job-autopilot'
$Skill = Split-Path $PSScriptRoot -Parent
$McpVer = '0.0.83'
$YamlVer = '2.9.1'
$FreehireUrl = 'https://freehire.me/api/v1/mcp'
function Say($m) { Write-Host "> $m" -ForegroundColor Cyan }
function Has($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }

# node 18+
if (-not (Has node)) { throw 'Node.js 18 or newer is required: https://nodejs.org' }
$node = (Get-Command node).Source
if ([int](& $node -p 'parseInt(process.versions.node)') -lt 18) { throw "Node.js 18 or newer is required (found $(& $node -v))" }
$ja = Join-Path $Skill 'scripts\ja.mjs'
if ($Doctor) { & $node $ja doctor; exit $LASTEXITCODE }

'browser-profile', 'screenshots', 'recipes' | ForEach-Object { New-Item -ItemType Directory -Force -Path (Join-Path $App $_) | Out-Null }
$pkg = Join-Path $App 'package.json'
if (-not (Test-Path $pkg)) { Set-Content -Path $pkg -Value '{ "private": true }' -Encoding ascii }

Say "Installing Playwright MCP $McpVer and yaml $YamlVer into $App"
& npm install --prefix $App --no-audit --no-fund --loglevel=error "@playwright/mcp@$McpVer" "yaml@$YamlVer"
if ($LASTEXITCODE) { throw 'npm install failed' }

Say 'Downloading Chromium'
& (Join-Path $App 'node_modules\.bin\playwright.cmd') install chromium
if ($LASTEXITCODE) { throw 'Chromium download failed' }

# form filler, injected into every page the agent opens
$fill = Join-Path $App 'recipes\fill.js'
Copy-Item (Join-Path $Skill 'scripts\recipes\fill.js') $fill -Force

$prof = Join-Path $App 'profile.yaml'
if (-not (Test-Path $prof)) {
  Copy-Item (Join-Path $Skill 'templates\profile.example.yaml') $prof
  Say "Profile template created: $prof"
  if (Test-Path (Join-Path $App 'profile.md')) { Say 'An older profile.md is there too: ask your agent to move it into profile.yaml' }
}

$cli = Join-Path $App 'node_modules\@playwright\mcp\cli.js'
$browser = @('--', $node, $cli, '--browser', 'chromium', '--user-data-dir', (Join-Path $App 'browser-profile'), '--output-dir', (Join-Path $App 'screenshots'), '--snapshot-mode', 'none', '--image-responses', 'omit', '--init-script', $fill)
if ($Headless) { $browser += '--headless'; $NoBrowser = $true }
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
  if ($LASTEXITCODE) {
    # codex starts an oauth sign-in right after adding an http server: never let it block setup
    $job = Start-Job { codex mcp add freehire --url $using:FreehireUrl }
    Wait-Job $job -Timeout 20 | Out-Null
    Remove-Job $job -Force
    Say 'Codex: if freehire asks you to sign in, run once: codex mcp login freehire'
  }
  & codex mcp remove job-browser *> $null
  & codex mcp add job-browser @browser
}

if (-not $found) { Say 'Claude Code or Codex not found on PATH. Install one, then run this script again to register the MCP servers.' }

if (-not $NoBrowser) {
  Say 'Opening Chromium (close it when you are done signing in)'
  Start-Process -FilePath $node -ArgumentList "`"$(Join-Path $Skill 'scripts\open-browser.mjs')`"" -WindowStyle Hidden
}

Say 'Checking the install'
& $node $ja doctor

Write-Host @"

Job Autopilot is installed.

  1. In the Chromium window: sign in to any job sites you use (optional), then CLOSE the window.
  2. Restart Claude Code or Codex so they load the new MCP servers.
  3. Ask:  /job-autopilot apply to remote React developer jobs in Europe
     (Codex: `$job-autopilot ... or just ask in plain words)

The first run asks a few questions and saves them to $prof.
Health check any time: powershell -ExecutionPolicy Bypass -File "$PSCommandPath" -Doctor
"@
