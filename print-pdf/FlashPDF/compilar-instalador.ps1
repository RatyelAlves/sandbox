# Gera FlashPDF.exe + FlashPDF_Portable.exe e compila os instaladores (Inno Setup).
# Uso: powershell -ExecutionPolicy Bypass -File .\compilar-instalador.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Get-InnoCompiler {
    $isccPaths = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
    )
    return ($isccPaths | Where-Object { Test-Path $_ } | Select-Object -First 1)
}

Write-Host "=== Passo 1: Gerando FlashPDF.exe ===" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "build.ps1")

$exeForInno = Join-Path $root "installer\FlashPDF.exe"
if (-not (Test-Path $exeForInno)) {
    throw "FlashPDF.exe nao foi criado em installer\. Verifique o build.ps1."
}

Write-Host "=== Passo 2: Gerando FlashPDF_Portable.exe ===" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "build.ps1") -Portable

$portableForInno = Join-Path $root "installer\FlashPDF_Portable.exe"
if (-not (Test-Path $portableForInno)) {
    throw "FlashPDF_Portable.exe nao foi criado em installer\. Verifique o build.ps1 -Portable."
}

$iscc = Get-InnoCompiler
if (-not $iscc) {
    Write-Host ""
    Write-Host "Inno Setup nao instalado. Os executaveis ja estao em:" -ForegroundColor Yellow
    Write-Host "  $exeForInno"
    Write-Host "  $portableForInno"
    Write-Host ""
    Write-Host "Instale o Inno Setup e compile manualmente:" -ForegroundColor Yellow
    Write-Host "  installer\FlashPDF_Setup.iss"
    Write-Host "  installer\FlashPDF_Portable_Setup.iss"
    exit 0
}

Write-Host "=== Passo 3: Compilando FlashPDF_Setup.exe ===" -ForegroundColor Cyan
& $iscc (Join-Path $root "installer\FlashPDF_Setup.iss")

Write-Host "=== Passo 4: Compilando FlashPDF_Portable_Setup.exe ===" -ForegroundColor Cyan
& $iscc (Join-Path $root "installer\FlashPDF_Portable_Setup.iss")

$setupOut = Join-Path $root "installer\Output\FlashPDF_Setup.exe"
$portableSetupOut = Join-Path $root "installer\Output\FlashPDF_Portable_Setup.exe"

Write-Host ""
if (Test-Path $setupOut) {
    Write-Host "Instalador padrao:" -ForegroundColor Green
    Write-Host "  $setupOut"
} else {
    Write-Host "AVISO: FlashPDF_Setup.exe nao encontrado em installer\Output\" -ForegroundColor Yellow
}

if (Test-Path $portableSetupOut) {
    Write-Host "Instalador portable (Sumatra incluso):" -ForegroundColor Green
    Write-Host "  $portableSetupOut"
} else {
    Write-Host "AVISO: FlashPDF_Portable_Setup.exe nao encontrado em installer\Output\" -ForegroundColor Yellow
}
