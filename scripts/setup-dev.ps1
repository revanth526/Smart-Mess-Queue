# ============================================================
# Smart Mess Queue — Development Setup Script
# ============================================================
# Run this from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts/setup-dev.ps1
#
# What it does:
#   1. Prompts for your PostgreSQL password
#   2. Updates DATABASE_URL in .env
#   3. Runs prisma migrate dev (creates/updates the DB schema)
#   4. Seeds the test account (rkrevanth07@gmail.com / TestPass@123)
# ============================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "🚀  Smart Mess Queue — Development Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Collect PostgreSQL password ────────────────────────────────────────
$pgPassword = Read-Host -Prompt "Enter your PostgreSQL password for user 'postgres'" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

# ── Step 2: Update .env ────────────────────────────────────────────────────────
$envPath = Join-Path $projectRoot ".env"
if (-not (Test-Path $envPath)) {
  Write-Error ".env file not found at $envPath. Copy .env.example to .env first."
  exit 1
}

$envContent = Get-Content $envPath -Raw

# Replace the DATABASE_URL line (handles any existing password)
$newDatabaseUrl = "DATABASE_URL=postgresql://postgres:$pgPasswordPlain@localhost:5432/smart_mess_dev"
$envContent = $envContent -replace 'DATABASE_URL=.*', $newDatabaseUrl

Set-Content $envPath $envContent -NoNewline
Write-Host "✅  Updated DATABASE_URL in .env" -ForegroundColor Green

# ── Step 3: Run prisma migrate dev ─────────────────────────────────────────────
Write-Host ""
Write-Host "🔄  Running database migrations..." -ForegroundColor Yellow
Set-Location (Join-Path $projectRoot "server")

$env:DATABASE_URL = $newDatabaseUrl.Substring("DATABASE_URL=".Length)

npx prisma migrate dev --name init_schema 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Migration failed. Check your PostgreSQL connection and try again."
  exit 1
}
Write-Host "✅  Migrations applied" -ForegroundColor Green

# ── Step 4: Seed the test account ──────────────────────────────────────────────
Write-Host ""
Write-Host "🌱  Seeding test account..." -ForegroundColor Yellow
npx prisma db seed 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Seed failed. See error above."
  exit 1
}
Write-Host "✅  Seed complete" -ForegroundColor Green

# ── Done ───────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🎉  Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Start the application:" -ForegroundColor Cyan
Write-Host "  cd $projectRoot"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Credentials:" -ForegroundColor Cyan
Write-Host "  Email   : rkrevanth07@gmail.com"
Write-Host "  Password: TestPass@123"
Write-Host "  Role    : MESS_ADMIN  →  redirects to /admin"
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:5173"
Write-Host "  Backend  : http://localhost:3000"
Write-Host "  API base : http://localhost:3000/api"
Write-Host ""
