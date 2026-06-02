Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# =========================
# VARIAVEIS GLOBAIS
# =========================
$script:AppVersion = "1.2"
$script:PastaPDFs = ""
$script:PrinterName = ""
$script:Duplex = "Simplex"
$script:CancelPrint = $false
$script:SortOrder = "Nome"
$script:PdfQueue = @()
$script:ScanMeta = @{ NeedsWinRar = $false; SkippedRar = 0; DuplicatesRemoved = 0 }

# =========================
# SUMATRA DETECTION
# (bundled: extraido em %LOCALAPPDATA%\FlashPDF\SumatraPDF.exe pelo build portable)
# =========================
$BundledSumatra = Join-Path $env:LOCALAPPDATA "FlashPDF\SumatraPDF.exe"

$Sumatra = @(
    $BundledSumatra,
    "$env:ProgramFiles\SumatraPDF\SumatraPDF.exe",
    "$env:ProgramFiles(x86)\SumatraPDF\SumatraPDF.exe",
    "$env:LOCALAPPDATA\SumatraPDF\SumatraPDF.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $Sumatra) {
    $Sumatra = Get-ChildItem "$env:LOCALAPPDATA\SumatraPDF" `
        -Recurse -Filter "SumatraPDF.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $Sumatra) {
    [System.Windows.Forms.MessageBox]::Show(
        "SumatraPDF nao encontrado.`n`nUse FlashPDF_Portable.exe (Sumatra incluso) ou instale em:`nhttps://www.sumatrapdfreader.org/",
        "FlashPDF",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Warning
    ) | Out-Null
    return
}

# =========================
# WINRAR (opcional - apenas RAR)
# =========================
$WinRAR = @(
    "$env:ProgramFiles\WinRAR\WinRAR.exe",
    "$env:ProgramFiles(x86)\WinRAR\WinRAR.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

# =========================
# FUNCOES
# =========================

function Get-LogDir {
    Join-Path $env:LOCALAPPDATA "FlashPDF"
}

function Get-LogPath {
    Join-Path (Get-LogDir) "print-log.txt"
}

function Get-SettingsPath {
    Join-Path (Get-LogDir) "settings.json"
}

function Get-FlashPdfSettings {
    $path = Get-SettingsPath
    if (-not (Test-Path $path)) { return @{} }

    try {
        $raw = Get-Content -Path $path -Raw -Encoding UTF8
        if (-not $raw) { return @{} }
        return ($raw | ConvertFrom-Json -ErrorAction Stop)
    } catch {
        Write-PrintLog "Aviso: settings.json invalido, usando padrao."
        return @{}
    }
}

function Save-FlashPdfSettings {
    param(
        [string]$Folder = $script:PastaPDFs,
        [string]$Printer = $script:PrinterName,
        [string]$Duplex = $script:Duplex,
        [string]$Sort = $script:SortOrder
    )

    $logDir = Get-LogDir
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    $data = @{
        LastFolder = $Folder
        PrinterName = $Printer
        Duplex = $Duplex
        SortOrder = $Sort
    }

    $data | ConvertTo-Json | Set-Content -Path (Get-SettingsPath) -Encoding UTF8
}

function Write-PrintLog($message) {
    $logDir = Get-LogDir
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $message"
    Add-Content -Path (Get-LogPath) -Value $line -Encoding UTF8
}

function Expand-ZipArchive($file, $dest) {
    Expand-Archive -LiteralPath $file -DestinationPath $dest -Force
}

function Extract-RarArchive($file, $dest) {
    Start-Process $WinRAR -ArgumentList "x `"$file`" `"$dest`" -y" -Wait -NoNewWindow
}

function Get-PDFsInPath($path) {
    Get-ChildItem $path -Recurse -Filter *.pdf -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -gt 0 }
}

function Remove-DuplicatePdfPaths($paths) {
    if (-not $paths -or $paths.Count -eq 0) { return @() }

    $seen = @{}
    $unique = [System.Collections.Generic.List[string]]::new()

    foreach ($p in $paths) {
        $key = $p.ToLowerInvariant()
        if (-not $seen.ContainsKey($key)) {
            $seen[$key] = $true
            $unique.Add($p)
        }
    }

    return @($unique)
}

function Sort-PdfPaths($paths, $sortOrder) {
    if (-not $paths -or $paths.Count -eq 0) { return @() }

    $items = foreach ($p in $paths) {
        if (Test-Path $p) { Get-Item -LiteralPath $p }
    }

    $sorted = switch ($sortOrder) {
        "Data"  { $items | Sort-Object LastWriteTime, Name }
        "Pasta" { $items | Sort-Object DirectoryName, Name }
        default { $items | Sort-Object Name }
    }

    @($sorted | ForEach-Object { $_.FullName })
}

function Update-PdfListBox {
    param(
        [System.Windows.Forms.ListBox]$ListBox,
        [string[]]$Paths
    )

    $ListBox.BeginUpdate()
    $ListBox.Items.Clear()

    foreach ($p in $Paths) {
        $name = Split-Path $p -Leaf
        $dir = Split-Path $p -Parent
        if ($script:SortOrder -eq "Pasta") {
            $parent = Split-Path $dir -Leaf
            if ($parent) { $name = "$parent\$name" }
        }
        [void]$ListBox.Items.Add($name)
    }

    $ListBox.EndUpdate()
}

function Get-CountLabelText {
    param(
        [int]$Count,
        [hashtable]$Meta
    )

    if ($Count -eq 0) { return "Nenhum PDF encontrado" }

    $parts = @("$Count PDF(s) pronto(s) para impressao")
    if ($Meta.SkippedRar -gt 0) {
        $parts += "$($Meta.SkippedRar) RAR ignorado(s)"
    }
    if ($Meta.DuplicatesRemoved -gt 0) {
        $parts += "$($Meta.DuplicatesRemoved) duplicado(s) removido(s)"
    }

    return ($parts -join " | ")
}

function Set-PrinterDuplex($printerName, $duplexMode) {
    try {
        if ($duplexMode -eq "Duplex") {
            Set-PrintConfiguration -PrinterName $printerName -DuplexingMode TwoSidedLongEdge
        } else {
            Set-PrintConfiguration -PrinterName $printerName -DuplexingMode OneSided
        }
    } catch {
        Write-PrintLog "Aviso: duplex nao configurado em '$printerName'."
    }
}

function Collect-PDFsFromFolder($folderPath, $tempRoot) {
    $pdfs = [System.Collections.Generic.List[string]]::new()
    $needsWinRar = $false
    $skippedRar = 0

    $files = Get-ChildItem $folderPath -File -Recurse -ErrorAction SilentlyContinue

    foreach ($f in $files) {
        $ext = $f.Extension.ToLower()

        if ($ext -eq ".pdf") {
            if ($f.Length -gt 0) {
                $pdfs.Add($f.FullName)
            }
            continue
        }

        if ($ext -eq ".zip") {
            $dest = Join-Path $tempRoot ([guid]::NewGuid().ToString())
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
            try {
                Expand-ZipArchive $f.FullName $dest
                foreach ($pdf in (Get-PDFsInPath $dest)) {
                    $pdfs.Add($pdf.FullName)
                }
            } catch {
                Write-PrintLog "ERRO ao extrair ZIP: $($f.FullName) - $($_.Exception.Message)"
            }
            continue
        }

        if ($ext -eq ".rar") {
            if (-not $WinRAR) {
                $needsWinRar = $true
                $skippedRar++
                Write-PrintLog "Ignorado (WinRAR ausente): $($f.FullName)"
                continue
            }

            $dest = Join-Path $tempRoot ([guid]::NewGuid().ToString())
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
            try {
                Extract-RarArchive $f.FullName $dest
                foreach ($pdf in (Get-PDFsInPath $dest)) {
                    $pdfs.Add($pdf.FullName)
                }
            } catch {
                Write-PrintLog "ERRO ao extrair RAR: $($f.FullName) - $($_.Exception.Message)"
            }
        }
    }

    $rawCount = $pdfs.Count
    $deduped = Remove-DuplicatePdfPaths @($pdfs)

    return @{
        Pdfs = $deduped
        NeedsWinRar = $needsWinRar
        SkippedRar = $skippedRar
        DuplicatesRemoved = [Math]::Max(0, $rawCount - $deduped.Count)
    }
}

function Invoke-FolderScan {
    param(
        [string]$FolderPath,
        [System.Windows.Forms.Label]$CountLabel,
        [System.Windows.Forms.Label]$StatusLabel,
        [System.Windows.Forms.ListBox]$ListBox
    )

    if (-not $FolderPath) { return @() }

    $CountLabel.Text = "Analisando pasta..."
    $StatusLabel.Text = ""
    if ($ListBox) {
        $ListBox.Items.Clear()
    }
    [System.Windows.Forms.Application]::DoEvents()

    $temp = "$env:TEMP\FlashPDF_Scan"
    if (Test-Path $temp) {
        Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path $temp -Force | Out-Null

    $result = Collect-PDFsFromFolder $FolderPath $temp
    Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue

    $script:ScanMeta.NeedsWinRar = $result.NeedsWinRar
    $script:ScanMeta.SkippedRar = $result.SkippedRar
    $script:ScanMeta.DuplicatesRemoved = $result.DuplicatesRemoved

    $sorted = Sort-PdfPaths $result.Pdfs $script:SortOrder
    $script:PdfQueue = $sorted

    $CountLabel.Text = Get-CountLabelText -Count $sorted.Count -Meta $script:ScanMeta
    if ($ListBox) {
        Update-PdfListBox -ListBox $ListBox -Paths $sorted
    }

    if ($result.NeedsWinRar -and $result.SkippedRar -gt 0) {
        [System.Windows.Forms.MessageBox]::Show(
            "$($result.SkippedRar) arquivo(s) RAR foram ignorados (WinRAR nao instalado).`nZIP e PDFs na pasta continuam normais.",
            "FlashPDF",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information
        ) | Out-Null
    }

    return $sorted
}

function Show-PrintConfig {
    param(
        [string]$DefaultPrinter = "",
        [string]$DefaultDuplex = "Simplex"
    )

    $cfg = New-Object System.Windows.Forms.Form
    $cfg.Text = "Configuracao de Impressao"
    $cfg.Size = New-Object System.Drawing.Size(360, 240)
    $cfg.StartPosition = "CenterParent"
    $cfg.FormBorderStyle = "FixedDialog"
    $cfg.MaximizeBox = $false

    $lbl = New-Object System.Windows.Forms.Label
    $lbl.Text = "Impressora:"
    $lbl.Location = New-Object System.Drawing.Point(20, 20)
    $cfg.Controls.Add($lbl)

    $comboPrinters = New-Object System.Windows.Forms.ComboBox
    $comboPrinters.Location = New-Object System.Drawing.Point(20, 45)
    $comboPrinters.Size = New-Object System.Drawing.Size(300, 25)
    $comboPrinters.DropDownStyle = "DropDownList"
    $cfg.Controls.Add($comboPrinters)

    $printerNames = @(Get-Printer | Select-Object -ExpandProperty Name)
    $comboPrinters.Items.AddRange($printerNames)

    $preferred = $DefaultPrinter
    if (-not $preferred) {
        $preferred = (Get-Printer | Where-Object { $_.Default -eq $true } | Select-Object -First 1 -ExpandProperty Name)
    }
    if ($preferred -and $comboPrinters.Items.Contains($preferred)) {
        $comboPrinters.SelectedItem = $preferred
    } elseif ($comboPrinters.Items.Count -gt 0) {
        $comboPrinters.SelectedIndex = 0
    }

    $chkDuplex = New-Object System.Windows.Forms.CheckBox
    $chkDuplex.Text = "Impressao frente e verso"
    $chkDuplex.Location = New-Object System.Drawing.Point(20, 85)
    $chkDuplex.Checked = ($DefaultDuplex -eq "Duplex")
    $cfg.Controls.Add($chkDuplex)

    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = "OK"
    $btn.Location = New-Object System.Drawing.Point(20, 130)
    $btn.Size = New-Object System.Drawing.Size(300, 40)
    $cfg.Controls.Add($btn)

    $btn.Add_Click({
        if (-not $comboPrinters.SelectedItem) {
            [System.Windows.Forms.MessageBox]::Show("Selecione uma impressora.") | Out-Null
            return
        }

        $script:PrinterName = $comboPrinters.SelectedItem
        $script:Duplex = if ($chkDuplex.Checked) { "Duplex" } else { "Simplex" }
        Save-FlashPdfSettings

        $cfg.Close()
    })

    $cfg.ShowDialog() | Out-Null
}

function Invoke-PrintJob {
    param(
        [string[]]$Pdfs,
        [System.Windows.Forms.ProgressBar]$ProgressBar,
        [System.Windows.Forms.Label]$StatusLabel,
        [System.Windows.Forms.Button]$BtnPrint,
        [System.Windows.Forms.Button]$BtnPasta,
        [System.Windows.Forms.Button]$BtnRefresh,
        [System.Windows.Forms.ComboBox]$ComboSort,
        [System.Windows.Forms.Button]$BtnCancel
    )

    Set-PrinterDuplex $script:PrinterName $script:Duplex

    $script:CancelPrint = $false
    $BtnPrint.Enabled = $false
    $BtnPasta.Enabled = $false
    $BtnRefresh.Enabled = $false
    $ComboSort.Enabled = $false
    $BtnCancel.Enabled = $true
    $ProgressBar.Maximum = [Math]::Max(1, $Pdfs.Count)
    $ProgressBar.Value = 0

    Write-PrintLog "Inicio - impressora: $script:PrinterName, duplex: $script:Duplex, total: $($Pdfs.Count), ordem: $script:SortOrder, pasta: $script:PastaPDFs"

    $i = 0
    $errors = 0
    $failed = [System.Collections.Generic.List[string]]::new()
    $cancelled = $false

    foreach ($p in $Pdfs) {
        if ($script:CancelPrint) {
            $cancelled = $true
            Write-PrintLog "Cancelado pelo usuario em $i / $($Pdfs.Count)"
            break
        }

        $fileName = Split-Path $p -Leaf
        $StatusLabel.Text = "Imprimindo $($i + 1) / $($Pdfs.Count)`n$fileName"
        [System.Windows.Forms.Application]::DoEvents()

        try {
            $proc = Start-Process -FilePath $Sumatra `
                -ArgumentList "-print-to `"$script:PrinterName`" `"$p`"" `
                -NoNewWindow -PassThru -Wait
            if ($proc.ExitCode -ne 0) {
                throw "SumatraPDF retornou codigo $($proc.ExitCode)"
            }
            Write-PrintLog "OK: $p"
        } catch {
            $errors++
            $failed.Add($p)
            $errMsg = $_.Exception.Message
            Write-PrintLog "ERRO: $p - $errMsg"
        }

        $i++
        $ProgressBar.Value = [Math]::Min($i, $ProgressBar.Maximum)
        [System.Windows.Forms.Application]::DoEvents()
    }

    $BtnPrint.Enabled = $true
    $BtnPasta.Enabled = $true
    $BtnRefresh.Enabled = $true
    $ComboSort.Enabled = $true
    $BtnCancel.Enabled = $false
    $StatusLabel.Text = ""

    return @{
        Printed = $i
        Errors = $errors
        FailedPaths = @($failed)
        Cancelled = $cancelled
        Total = $Pdfs.Count
    }
}

function Show-PrintResult {
    param(
        [hashtable]$Result
    )

    if ($Result.Cancelled) {
        [System.Windows.Forms.MessageBox]::Show(
            "Impressao cancelada.`nImpressos: $($Result.Printed) de $($Result.Total).",
            "FlashPDF"
        ) | Out-Null
        return @()
    }

    if ($Result.Errors -gt 0) {
        $retry = [System.Windows.Forms.MessageBox]::Show(
            "Concluido com $($Result.Errors) erro(s).`nVeja o log (botao Abrir pasta do log).`n`nDeseja tentar imprimir novamente apenas os arquivos com erro?",
            "FlashPDF",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )
        if ($retry -eq [System.Windows.Forms.DialogResult]::Yes) {
            return @($Result.FailedPaths)
        }
        return @()
    }

    Write-PrintLog "Concluido - $($Result.Printed) arquivo(s) impresso(s)."
    [System.Windows.Forms.MessageBox]::Show("Impressao concluida! ($($Result.Printed) PDFs)") | Out-Null
    return @()
}

function Set-FolderSelection {
    param(
        [string]$FolderPath,
        [System.Windows.Forms.Label]$PathLabel,
        [System.Windows.Forms.Label]$CountLabel,
        [System.Windows.Forms.Label]$StatusLabel,
        [System.Windows.Forms.ListBox]$ListBox
    )

    if (-not $FolderPath -or -not (Test-Path $FolderPath)) { return $false }

    $script:PastaPDFs = $FolderPath
    $PathLabel.Text = $script:PastaPDFs
    Save-FlashPdfSettings
    Invoke-FolderScan -FolderPath $script:PastaPDFs -CountLabel $CountLabel -StatusLabel $StatusLabel -ListBox $ListBox | Out-Null
    return $true
}

# =========================
# FORM PRINCIPAL
# =========================
$form = New-Object System.Windows.Forms.Form
$form.Text = "FlashPDF PRO v$script:AppVersion"
$form.Size = New-Object System.Drawing.Size(440, 580)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.AllowDrop = $true

$y = 15

$btnPasta = New-Object System.Windows.Forms.Button
$btnPasta.Text = "Selecionar pasta"
$btnPasta.Location = New-Object System.Drawing.Point(20, $y)
$btnPasta.Size = New-Object System.Drawing.Size(280, 30)
$form.Controls.Add($btnPasta)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "Atualizar"
$btnRefresh.Location = New-Object System.Drawing.Point(310, $y)
$btnRefresh.Size = New-Object System.Drawing.Size(100, 30)
$btnRefresh.Enabled = $false
$form.Controls.Add($btnRefresh)
$y += 40

$lblPasta = New-Object System.Windows.Forms.Label
$lblPasta.Text = "Nenhuma pasta selecionada (ou arraste uma pasta aqui)"
$lblPasta.Location = New-Object System.Drawing.Point(20, $y)
$lblPasta.Size = New-Object System.Drawing.Size(320, 36)
$lblPasta.AutoEllipsis = $true
$form.Controls.Add($lblPasta)

$btnOpenFolder = New-Object System.Windows.Forms.Button
$btnOpenFolder.Text = "Abrir"
$btnOpenFolder.Location = New-Object System.Drawing.Point(350, $y)
$btnOpenFolder.Size = New-Object System.Drawing.Size(60, 28)
$btnOpenFolder.Enabled = $false
$form.Controls.Add($btnOpenFolder)
$y += 42

$lblCount = New-Object System.Windows.Forms.Label
$lblCount.Text = ""
$lblCount.Location = New-Object System.Drawing.Point(20, $y)
$lblCount.Size = New-Object System.Drawing.Size(390, 24)
$lblCount.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($lblCount)
$y += 28

$lblList = New-Object System.Windows.Forms.Label
$lblList.Text = "Arquivos na fila:"
$lblList.Location = New-Object System.Drawing.Point(20, $y)
$lblList.Size = New-Object System.Drawing.Size(390, 20)
$form.Controls.Add($lblList)
$y += 22

$lstPdfs = New-Object System.Windows.Forms.ListBox
$lstPdfs.Location = New-Object System.Drawing.Point(20, $y)
$lstPdfs.Size = New-Object System.Drawing.Size(390, 120)
$lstPdfs.IntegralHeight = $false
$form.Controls.Add($lstPdfs)
$y += 128

$lblSort = New-Object System.Windows.Forms.Label
$lblSort.Text = "Ordenar por:"
$lblSort.Location = New-Object System.Drawing.Point(20, $y)
$lblSort.Size = New-Object System.Drawing.Size(90, 22)
$form.Controls.Add($lblSort)

$comboSort = New-Object System.Windows.Forms.ComboBox
$comboSort.Location = New-Object System.Drawing.Point(110, ($y - 2))
$comboSort.Size = New-Object System.Drawing.Size(300, 25)
$comboSort.DropDownStyle = "DropDownList"
[void]$comboSort.Items.AddRange(@("Nome", "Data", "Pasta"))
$comboSort.SelectedIndex = 0
$form.Controls.Add($comboSort)
$y += 35

$btnPrint = New-Object System.Windows.Forms.Button
$btnPrint.Text = "IMPRIMIR"
$btnPrint.Location = New-Object System.Drawing.Point(20, $y)
$btnPrint.Size = New-Object System.Drawing.Size(390, 45)
$form.Controls.Add($btnPrint)
$y += 55

$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(20, $y)
$progressBar.Size = New-Object System.Drawing.Size(390, 22)
$form.Controls.Add($progressBar)
$y += 30

$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = ""
$lblStatus.Location = New-Object System.Drawing.Point(20, $y)
$lblStatus.Size = New-Object System.Drawing.Size(390, 36)
$form.Controls.Add($lblStatus)
$y += 42

$btnCancel = New-Object System.Windows.Forms.Button
$btnCancel.Text = "Cancelar impressao"
$btnCancel.Location = New-Object System.Drawing.Point(20, $y)
$btnCancel.Size = New-Object System.Drawing.Size(190, 32)
$btnCancel.Enabled = $false
$form.Controls.Add($btnCancel)

$btnLog = New-Object System.Windows.Forms.Button
$btnLog.Text = "Abrir pasta do log"
$btnLog.Location = New-Object System.Drawing.Point(220, $y)
$btnLog.Size = New-Object System.Drawing.Size(190, 32)
$form.Controls.Add($btnLog)
$y += 40

$lblLog = New-Object System.Windows.Forms.Label
$lblLog.Text = (Get-LogPath)
$lblLog.Location = New-Object System.Drawing.Point(20, $y)
$lblLog.Size = New-Object System.Drawing.Size(390, 32)
$lblLog.ForeColor = [System.Drawing.Color]::Gray
$lblLog.AutoEllipsis = $true
$form.Controls.Add($lblLog)

# =========================
# RESTAURAR CONFIGURACOES
# =========================
$saved = Get-FlashPdfSettings
if ($saved.SortOrder -and $comboSort.Items.Contains([string]$saved.SortOrder)) {
    $comboSort.SelectedItem = [string]$saved.SortOrder
    $script:SortOrder = [string]$saved.SortOrder
}
if ($saved.PrinterName) { $script:PrinterName = [string]$saved.PrinterName }
if ($saved.Duplex) { $script:Duplex = [string]$saved.Duplex }

if ($saved.LastFolder -and (Test-Path $saved.LastFolder)) {
    $script:PastaPDFs = [string]$saved.LastFolder
    $lblPasta.Text = $script:PastaPDFs
    $btnOpenFolder.Enabled = $true
    $btnRefresh.Enabled = $true
    Invoke-FolderScan -FolderPath $script:PastaPDFs -CountLabel $lblCount -StatusLabel $lblStatus -ListBox $lstPdfs | Out-Null
}

# =========================
# EVENTOS
# =========================
$btnPasta.Add_Click({
    $d = New-Object System.Windows.Forms.FolderBrowserDialog
    if ($script:PastaPDFs) { $d.SelectedPath = $script:PastaPDFs }
    if ($d.ShowDialog() -eq "OK") {
        Set-FolderSelection -FolderPath $d.SelectedPath -PathLabel $lblPasta -CountLabel $lblCount -StatusLabel $lblStatus -ListBox $lstPdfs | Out-Null
        $btnOpenFolder.Enabled = $true
        $btnRefresh.Enabled = $true
    }
})

$btnRefresh.Add_Click({
    if (-not $script:PastaPDFs) { return }
    Invoke-FolderScan -FolderPath $script:PastaPDFs -CountLabel $lblCount -StatusLabel $lblStatus -ListBox $lstPdfs | Out-Null
})

$btnOpenFolder.Add_Click({
    if ($script:PastaPDFs -and (Test-Path $script:PastaPDFs)) {
        Start-Process "explorer.exe" -ArgumentList $script:PastaPDFs
    }
})

$form.Add_DragEnter({
    param($sender, $e)
    if ($e.Data.GetDataPresent([System.Windows.Forms.DataFormats]::FileDrop)) {
        $e.Effect = [System.Windows.Forms.DragDropEffects]::Copy
    }
})

$form.Add_DragDrop({
    param($sender, $e)
    $paths = $e.Data.GetData([System.Windows.Forms.DataFormats]::FileDrop)
    if (-not $paths -or $paths.Count -eq 0) { return }

    $folder = $paths[0]
    if (-not (Test-Path $folder -PathType Container)) {
        [System.Windows.Forms.MessageBox]::Show("Arraste uma pasta, nao um arquivo.") | Out-Null
        return
    }

    if (Set-FolderSelection -FolderPath $folder -PathLabel $lblPasta -CountLabel $lblCount -StatusLabel $lblStatus -ListBox $lstPdfs) {
        $btnOpenFolder.Enabled = $true
        $btnRefresh.Enabled = $true
    }
})

$comboSort.Add_SelectedIndexChanged({
    if ($comboSort.SelectedItem) {
        $script:SortOrder = [string]$comboSort.SelectedItem
        Save-FlashPdfSettings
        if ($script:PdfQueue.Count -gt 0) {
            $script:PdfQueue = Sort-PdfPaths $script:PdfQueue $script:SortOrder
            $lblCount.Text = Get-CountLabelText -Count $script:PdfQueue.Count -Meta $script:ScanMeta
            Update-PdfListBox -ListBox $lstPdfs -Paths $script:PdfQueue
        }
    }
})

$btnLog.Add_Click({
    $logDir = Get-LogDir
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    if (-not (Test-Path (Get-LogPath))) {
        Write-PrintLog "Log iniciado."
    }
    Start-Process "explorer.exe" -ArgumentList $logDir
})

$btnPrint.Add_Click({

    if (-not $script:PastaPDFs) {
        [System.Windows.Forms.MessageBox]::Show("Selecione uma pasta.") | Out-Null
        return
    }

    if ($script:PdfQueue.Count -eq 0) {
        Invoke-FolderScan -FolderPath $script:PastaPDFs -CountLabel $lblCount -StatusLabel $lblStatus -ListBox $lstPdfs | Out-Null
    }

    if ($script:PdfQueue.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("Nenhum PDF encontrado na pasta selecionada.") | Out-Null
        return
    }

    Show-PrintConfig -DefaultPrinter $script:PrinterName -DefaultDuplex $script:Duplex

    if (-not $script:PrinterName) {
        return
    }

    $duplexLabel = if ($script:Duplex -eq "Duplex") { "frente e verso" } else { "frente simples" }
    $confirm = [System.Windows.Forms.MessageBox]::Show(
        "Imprimir $($script:PdfQueue.Count) arquivo(s)?`n`nImpressora: $script:PrinterName`nModo: $duplexLabel`nOrdem: $script:SortOrder",
        "Confirmar impressao",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) {
        return
    }

    $pdfs = @($script:PdfQueue)
    $result = Invoke-PrintJob -Pdfs $pdfs -ProgressBar $progressBar -StatusLabel $lblStatus `
        -BtnPrint $btnPrint -BtnPasta $btnPasta -BtnRefresh $btnRefresh -ComboSort $comboSort -BtnCancel $btnCancel

    $retryPaths = Show-PrintResult -Result $result
    while ($retryPaths.Count -gt 0) {
        $retryConfirm = [System.Windows.Forms.MessageBox]::Show(
            "Reimprimir $($retryPaths.Count) arquivo(s) com erro?",
            "FlashPDF",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )
        if ($retryConfirm -ne [System.Windows.Forms.DialogResult]::Yes) { break }

        $retryResult = Invoke-PrintJob -Pdfs $retryPaths -ProgressBar $progressBar -StatusLabel $lblStatus `
            -BtnPrint $btnPrint -BtnPasta $btnPasta -BtnRefresh $btnRefresh -ComboSort $comboSort -BtnCancel $btnCancel
        $retryPaths = Show-PrintResult -Result $retryResult
    }
})

$btnCancel.Add_Click({
    $script:CancelPrint = $true
    $btnCancel.Enabled = $false
    $lblStatus.Text = "Cancelando..."
})

$form.Add_FormClosing({
    Save-FlashPdfSettings
})

$form.ShowDialog() | Out-Null
