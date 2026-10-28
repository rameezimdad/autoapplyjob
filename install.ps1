<#
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
#>
# job autopilot installer (windows)
#   irm https://raw.githubusercontent.com/rameezimdad/autoapplyjob/main/install.ps1 | iex
#   or from a clone: powershell -ExecutionPolicy Bypass -File install.ps1 [-NoBrowser]
param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'

$Repo = 'https://github.com/rameezimdad/autoapplyjob'
$App = if ($env:JOB_AUTOPILOT_HOME) { $env:JOB_AUTOPILOT_HOME } else { Join-Path $HOME '.job-autopilot' }
$here = $PSScriptRoot

# piped via iex = no checkout, fetch one
if (-not $here -or -not (Test-Path (Join-Path $here 'skills\job-autopilot\SKILL.md'))) {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git is required: https://git-scm.com' }
  New-Item -ItemType Directory -Force -Path $App | Out-Null
  $here = Join-Path $App 'repo'
  if (Test-Path (Join-Path $here '.git')) { git -C $here pull -q --ff-only } else { git clone -q --depth 1 $Repo $here }
  if ($LASTEXITCODE) { throw 'git failed' }
}
$src = Join-Path $here 'skills\job-autopilot'

# copy (symlinks need admin on windows)
foreach ($d in @((Join-Path $HOME '.claude\skills'), (Join-Path $HOME '.agents\skills'))) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  $dst = Join-Path $d 'job-autopilot'
  if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
  Copy-Item -Recurse $src $dst
  Write-Host "> Skill installed: $dst" -ForegroundColor Cyan
}

& (Join-Path $src 'scripts\setup.ps1') -NoBrowser:$NoBrowser
