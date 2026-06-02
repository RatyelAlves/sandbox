# Baixa o SumatraPDF portable (64-bit) para bundled\SumatraPDF.exe
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\prepare-sumatra.ps1

$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
$bundledDir = Join-Path $root "bundled"
$dest = Join-Path $bundledDir "SumatraPDF.exe"
$zipUrl = "https://www.sumatrapdfreader.org/dl/rel/3.5.2/SumatraPDF-3.5.2-64.zip"
$zipPath = Join-Path $env:TEMP "SumatraPDF-3.5.2-64.zip"

if (Test-Path $dest) {
    Write-Host "Sumatra portable ja existe: $dest"
    exit 0
}

if (-not (Test-Path $bundledDir)) {
    New-Item -ItemType Directory -Path $bundledDir -Force | Out-Null
}

Write-Host "Baixando SumatraPDF portable..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

$extractDir = Join-Path $env:TEMP "SumatraPDF_extract_$(Get-Random)"
New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

try {
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force
    $exe = Get-ChildItem $extractDir -Filter "SumatraPDF*.exe" -File | Select-Object -First 1
    if (-not $exe) {
        throw "Executavel do Sumatra nao encontrado no ZIP."
    }
    Copy-Item -LiteralPath $exe.FullName -Destination $dest -Force
    Write-Host "Salvo em: $dest"
} finally {
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue
}
