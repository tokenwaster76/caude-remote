# install-service.ps1 — Install MCP server + tunnel as a Windows scheduled task
# so it auto-starts on login (no window needed).
# Requires: Run as Administrator once.

#Requires -RunAsAdministrator
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectDir = Resolve-Path (Join-Path $PSScriptRoot '..\')
$cfExe      = Join-Path $PSScriptRoot 'cloudflared.exe'
$startScript = Join-Path $PSScriptRoot 'start-tunnel.ps1'

if (-not (Test-Path $cfExe)) {
    Write-Error "cloudflared.exe not found. Run .\scripts\setup.ps1 first."
}

$taskName = 'WindowsRemoteMCP'

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`"" `
    -WorkingDirectory $projectDir

$trigger = New-ScheduledTaskTrigger -AtLogon

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Description 'Starts Windows Remote MCP server and Cloudflare tunnel on login'

Write-Host "[ok] Scheduled task '$taskName' created." -ForegroundColor Green
Write-Host "     It will auto-start on your next login."
Write-Host "     To start it now: Start-ScheduledTask -TaskName '$taskName'"
Write-Host "     To remove it:    Unregister-ScheduledTask -TaskName '$taskName'"
