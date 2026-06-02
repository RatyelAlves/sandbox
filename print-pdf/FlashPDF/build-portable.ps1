# Gera FlashPDF_Portable.exe com SumatraPDF embutido (um unico arquivo).
# Uso: powershell -ExecutionPolicy Bypass -File .\build-portable.ps1

$ErrorActionPreference = "Stop"
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build.ps1") -Portable
