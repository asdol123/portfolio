# ==============================================================================
# SCRIPT POWERSHELL: COMPILADOR DE PORTAFOLIO PDF (A4 APAISADO)
# Adolfo Risopatrón Inzunza (Alzado Rojo)
# ==============================================================================

param(
    [string]$InputHtml = "$PSScriptRoot\..\portfolio-pdf.html",
    [string]$OutputPdf = "$PSScriptRoot\..\Adolfo_Risopatron_Portafolio_Arquitectura.pdf"
)

$InputHtmlPath = [System.IO.Path]::GetFullPath($InputHtml)
$OutputPdfPath = [System.IO.Path]::GetFullPath($OutputPdf)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🚀 COMPILADOR AUTOMÁTICO DE PORTAFOLIO PDF (POWERSHELL)" -ForegroundColor Cyan
Write-Host "   Alzado Rojo — Adolfo Risopatrón Inzunza" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Verificar existencia del archivo HTML
if (-not (Test-Path $InputHtmlPath)) {
    Write-Host "❌ Error: No se encontró el archivo HTML de entrada:" -ForegroundColor Red
    Write-Host "   $InputHtmlPath" -ForegroundColor Yellow
    Write-Host "   Asegúrese de haber maquetado 'portfolio-pdf.html'." -ForegroundColor Yellow
    exit 1
}

# 2. Localizar navegador Chrome o Edge
$browsers = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browserExe = $null
foreach ($b in $browsers) {
    if (Test-Path $b) {
        $browserExe = $b
        break
    }
}

if (-not $browserExe) {
    Write-Host "❌ Error: No se encontró Google Chrome ni Microsoft Edge en las rutas estándar." -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Motor de renderizado: $browserExe" -ForegroundColor Gray
Write-Host "📄 Archivo origen:  $InputHtmlPath" -ForegroundColor Gray
Write-Host "🎯 Archivo destino: $OutputPdfPath" -ForegroundColor Gray
Write-Host "⏳ Compilando documento A4 landscape..." -ForegroundColor Yellow

$fileUrl = "file:///" + $InputHtmlPath.Replace("\", "/")

$arguments = @(
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=12000",
    "--allow-file-access-from-files",
    "--print-to-pdf=`"$OutputPdfPath`"",
    "`"$fileUrl`""
)

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$proc = Start-Process -FilePath $browserExe -ArgumentList $arguments -Wait -PassThru -NoNewWindow
$sw.Stop()

if (Test-Path $OutputPdfPath) {
    $fileInfo = Get-Item $OutputPdfPath
    $sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    $elapsed = [math]::Round($sw.Elapsed.TotalSeconds, 1)

    Write-Host ""
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "✅ ¡PDF compilado exitosamente en $elapsed segundos!" -ForegroundColor Green
    Write-Host "📁 Destino: $OutputPdfPath" -ForegroundColor White
    Write-Host "⚖️ Peso:    $sizeMB MB ($($fileInfo.Length) bytes)" -ForegroundColor White

    if ($fileInfo.Length -le 25MB -and $fileInfo.Length -ge 5MB) {
        Write-Host "🎯 Rango óptimo: Cumple con el estándar de postulación internacional (5 MB - 25 MB)." -ForegroundColor Green
    } elseif ($fileInfo.Length -gt 25MB) {
        Write-Host "⚠️ Advertencia: El PDF supera los 25 MB ($sizeMB MB). Podría ser rechazado en formularios web con límite de 20-25 MB." -ForegroundColor Yellow
    } else {
        Write-Host "ℹ️ Peso ligero ($sizeMB MB). Verifique que todas las imágenes de alta resolución cargaron." -ForegroundColor Cyan
    }
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "❌ Error: La compilación no generó el archivo esperado." -ForegroundColor Red
    exit 1
}
