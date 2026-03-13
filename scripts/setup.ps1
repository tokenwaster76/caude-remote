# setup.ps1 — First-time setup for Windows Remote MCP
# Run from the project root: .\scripts\setup.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "`n=== Windows Remote MCP — Setup ===" -ForegroundColor Cyan

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Install it from https://nodejs.org and rerun."
}
Write-Host "[ok] Node.js $(node -v)"

# 2. Install dependencies
Write-Host "`nInstalling npm dependencies..."
npm install
npm run build
Write-Host "[ok] Build succeeded"

# 3. Create .env if missing
$envFile = Join-Path $PSScriptRoot '..\' '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $PSScriptRoot '..\' '.env.example') $envFile
    Write-Host "[ok] Created .env from .env.example"

    # Generate a random token
    $token = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    (Get-Content $envFile) -replace '^AUTH_TOKEN=$', "AUTH_TOKEN=$token" | Set-Content $envFile
    Write-Host "[ok] Generated AUTH_TOKEN (saved to .env)"
} else {
    Write-Host "[skip] .env already exists"
}

# 4. Download cloudflared if missing
$cfExe = Join-Path $PSScriptRoot 'cloudflared.exe'
if (-not (Test-Path $cfExe)) {
    Write-Host "`nDownloading cloudflared..."
    $url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
    Invoke-WebRequest -Uri $url -OutFile $cfExe -UseBasicParsing
    Write-Host "[ok] cloudflared downloaded to scripts\cloudflared.exe"
} else {
    Write-Host "[skip] cloudflared already present"
}

Write-Host "`n=== Setup complete ===" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "  1. Edit .env and confirm ALLOWED_PATHS"
Write-Host "  2. Run: .\scripts\start-tunnel.ps1"
Write-Host "  3. Copy the tunnel URL into Claude mobile > Settings > MCP Servers"
