Param(
  [string]$Dataset = "dataset_HR.xlsx",
  [string]$Target = "Statut",
  [string]$ApiBase = "http://127.0.0.1:3001"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$nlpDir = Join-Path $root "nlp-service"
$backendDir = Join-Path $root "backend"

Write-Host "[1/7] Checking Python launcher..."
$pyInfo = & py -0p 2>$null
if (-not $pyInfo) {
  throw "Python launcher (py) not found. Install Python and retry."
}
Write-Host $pyInfo

Write-Host "[2/7] Preparing nlp-service virtual environment..."
Set-Location $nlpDir
if (-not (Test-Path ".venv\Scripts\python.exe")) {
  & py -3 -m venv .venv
}

Write-Host "[3/7] Installing Python dependencies..."
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host "[4/7] Training model artifacts from dataset..."
& .\.venv\Scripts\python.exe train_from_xlsx.py --input $Dataset --target $Target

Write-Host "[5/7] Starting NLP API (if not already healthy)..."
$healthOk = $false
try {
  $null = Invoke-RestMethod "http://127.0.0.1:8000/health" -TimeoutSec 3
  $healthOk = $true
} catch {
  $healthOk = $false
}

if (-not $healthOk) {
  Start-Process -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","8000" -WindowStyle Hidden | Out-Null
  $up = $false
  foreach ($i in 1..25) {
    try {
      $null = Invoke-RestMethod "http://127.0.0.1:8000/health" -TimeoutSec 3
      $up = $true
      break
    } catch {
      Start-Sleep -Milliseconds 600
    }
  }
  if (-not $up) {
    throw "NLP API did not become healthy on port 8000."
  }
}

Write-Host "[6/7] Starting backend API (if port 3001 is not listening)..."
$backendListening = $false
try {
  $listener = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction Stop
  if ($listener) {
    $backendListening = $true
  }
} catch {
  $backendListening = $false
}

if (-not $backendListening) {
  Set-Location $backendDir
  Start-Process -FilePath "npm" -ArgumentList "run","start:dev" -WorkingDirectory $backendDir -WindowStyle Hidden | Out-Null

  $up = $false
  foreach ($i in 1..35) {
    try {
      $null = Invoke-WebRequest "$ApiBase/" -UseBasicParsing -TimeoutSec 3
      $up = $true
      break
    } catch {
      Start-Sleep -Milliseconds 800
    }
  }

  if (-not $up) {
    Write-Warning "Backend root probe did not respond yet. Continuing to integration probe."
  }
}

Write-Host "[7/7] Running no-seed integration probe..."
Set-Location $backendDir
$env:API_BASE = $ApiBase
node probe_predict_data.cjs

Write-Host "Done."
