# Gera src\flashpdf.ico se ainda nao existir.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$iconPath = Join-Path (Split-Path $PSScriptRoot -Parent) "src\flashpdf.ico"
if (Test-Path $iconPath) {
    Write-Host "Icone ja existe: $iconPath"
    exit 0
}

$size = 64
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(30, 64, 175))

$white = [System.Drawing.Brushes]::White
$font = New-Object System.Drawing.Font "Segoe UI", 14, [System.Drawing.FontStyle]::Bold
$g.DrawString("PDF", $font, $white, 8, 18)
$g.FillRectangle($white, 14, 8, 36, 6)
$g.Dispose()
$font.Dispose()

$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$stream = [System.IO.File]::Open($iconPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$bmp.Dispose()

Write-Host "Icone criado: $iconPath"
