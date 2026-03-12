# start-tunnel.ps1 — Start the MCP server and expose it via Cloudflare Tunnel
# Run from the project root: .\scripts\start-tunnel.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$cfExe   = Join-Path $PSScriptRoot 'cloudflared.exe'
$envFile = Join-Path $PSScriptRoot '..\' '.env'

if (-not (Test-Path $cfExe)) {
    Write-Error "cloudflared.exe not found. Run .\scripts\setup.ps1 first."
}

# Load .env to get PORT
$port = 3000
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '^PORT=' } | ForEach-Object {
        $port = [int]($_ -split '=', 2)[1]
    }
}

Write-Host "=== Windows Remote MCP ===" -ForegroundColor Cyan
Write-Host "Starting MCP server (port $port)..."

# Start MCP server in background
$serverJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    node dist/server.js
} -ArgumentList (Resolve-Path (Join-Path $PSScriptRoot '..\'))

Start-Sleep -Seconds 2

Write-Host "Starting Cloudflare Tunnel..."
$cfArgs = @('tunnel', '--url', "http://localhost:$port")

& $cfExe @cfArgs 2>&1 | Tee-Object -FilePath (Join-Path $PSScriptRoot '..\' 'tunnel-output.txt') | ForEach-Object {
    Write-Host $_
    # Extract tunnel URL and save it
    if ($_ -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
        $tunnelUrl = $Matches[0]
        $tunnelUrl | Out-File -FilePath (Join-Path $PSScriptRoot '..\' 'tunnel-url.txt') -Encoding utf8
        Write-Host "`n>>> Tunnel URL: $tunnelUrl/mcp" -ForegroundColor Green
        Write-Host ">>> Add this to Claude mobile: Settings > MCP Servers > New Server" -ForegroundColor Yellow
        Write-Host ">>> Bearer token is in your .env file (AUTH_TOKEN)" -ForegroundColor Yellow
    }
}

# Cleanup on exit
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
