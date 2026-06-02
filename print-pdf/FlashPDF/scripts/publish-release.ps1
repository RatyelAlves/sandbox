# Gera os .exe e copia para release/ (download manual no GitHub).
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\publish-release.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $root -Parent
$releaseDir = Join-Path $repoRoot "release"

& powershell -ExecutionPolicy Bypass -File (Join-Path $root "build-portable.ps1")
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "build.ps1")

if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
}

$portableOut = Join-Path $releaseDir "FlashPDF_Portable.exe"
$standardOut = Join-Path $releaseDir "FlashPDF.exe"

Copy-Item (Join-Path $root "dist\FlashPDF_Portable.exe") $portableOut -Force
Copy-Item (Join-Path $root "dist\FlashPDF.exe") $standardOut -Force

Write-Host ""
Write-Host "Release pronta em: $releaseDir" -ForegroundColor Green
Write-Host "  $portableOut  (recomendado para download)"
Write-Host "  $standardOut  (exige SumatraPDF instalado)"
Write-Host ""
Write-Host "Proximo passo:" -ForegroundColor Yellow
Write-Host "  git add ."
Write-Host "  git commit -m `"Atualiza executaveis`""
Write-Host "  git push origin main"
Write-Host ""
