# Gera FlashPDF.exe (e icone se necessario).
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\build.ps1
#   powershell -ExecutionPolicy Bypass -File .\build.ps1 -Portable

param(
    [switch]$Portable
)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$src = Join-Path $root "src\flashpdf.ps1"
$icon = Join-Path $root "src\flashpdf.ico"
$dist = Join-Path $root "dist"
$createIcon = Join-Path $root "scripts\create-icon.ps1"
$prepareSumatra = Join-Path $root "scripts\prepare-sumatra.ps1"
$bundledSumatra = Join-Path $root "bundled\SumatraPDF.exe"

if (-not (Test-Path $src)) {
    throw "Script nao encontrado: $src"
}

if (-not (Test-Path $icon) -and (Test-Path $createIcon)) {
    & powershell -ExecutionPolicy Bypass -File $createIcon
}

if (-not (Get-Module -ListAvailable -Name ps2exe)) {
    Write-Host "Instalando modulo ps2exe..."
    Install-Module ps2exe -Scope CurrentUser -Force
}

Import-Module ps2exe -Force

if (-not (Test-Path $dist)) {
    New-Item -ItemType Directory -Path $dist | Out-Null
}

if ($Portable) {
    if (-not (Test-Path $bundledSumatra)) {
        Write-Host "Preparando SumatraPDF portable..."
        & powershell -ExecutionPolicy Bypass -File $prepareSumatra
    }
    if (-not (Test-Path $bundledSumatra)) {
        throw "Sumatra portable nao encontrado. Coloque bundled\SumatraPDF.exe ou execute scripts\prepare-sumatra.ps1"
    }
    $exe = Join-Path $dist "FlashPDF_Portable.exe"
} else {
    $exe = Join-Path $dist "FlashPDF.exe"
}

$ps2exeArgs = @{
    inputFile  = $src
    outputFile = $exe
    noConsole  = $true
    sta        = $true
}

if (Test-Path $icon) {
    $ps2exeArgs.iconFile = $icon
}

if ($Portable) {
    $appVersion = (Select-String -Path $src -Pattern '\$script:AppVersion = "([^"]+)"').Matches.Groups[1].Value
    $segments = ($appVersion + ".0.0.0").Split('.')[0..3]
    $ps2exeArgs.embedFiles = @{
        '%LOCALAPPDATA%\FlashPDF\SumatraPDF.exe' = $bundledSumatra
    }
    $ps2exeArgs.title = "FlashPDF Portable"
    $ps2exeArgs.description = "FlashPDF com SumatraPDF embutido"
    $ps2exeArgs.version = ($segments -join '.')
}

if (-not $ps2exeArgs.ContainsKey('iconFile')) {
    Write-Host "Aviso: icone nao encontrado. Gerando sem icone..."
}

Invoke-PS2EXE @ps2exeArgs

Write-Host "Gerado: $exe"

if ($Portable) {
    $installerDir = Join-Path $root "installer"
    Copy-Item -Path $exe -Destination (Join-Path $installerDir "FlashPDF_Portable.exe") -Force

    $sizeMb = [Math]::Round((Get-Item $exe).Length / 1MB, 1)
    Write-Host "Modo portable (~${sizeMb} MB) - nao precisa instalar SumatraPDF."
    Write-Host "Distribua: $exe"
    Write-Host "Instalador Inno: installer\FlashPDF_Portable_Setup.iss"
    exit 0
}

$installerDir = Join-Path $root "installer"
Copy-Item -Path $exe -Destination (Join-Path $installerDir "FlashPDF.exe") -Force

$sumatra = Join-Path $root "SumatraPDF-3.5.2-64-install.exe"
if (Test-Path $sumatra) {
    Copy-Item -Path $sumatra -Destination (Join-Path $installerDir "SumatraPDF-3.5.2-64-install.exe") -Force
    Write-Host "Sumatra copiado para installer\"
}

if (-not (Test-Path (Join-Path $installerDir "FlashPDF.exe"))) {
    throw "Falha ao copiar FlashPDF.exe para installer\"
}

Write-Host ""
Write-Host "Pronto para Inno Setup. Arquivo:"
Write-Host "  $installerDir\FlashPDF.exe"
Write-Host "Abra no Inno: $installerDir\FlashPDF_Setup.iss"
Write-Host ""
