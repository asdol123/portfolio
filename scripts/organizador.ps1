Write-Host "--- INICIANDO ORGANIZADOR RECURSIVO (ANTI-COLISIONES) ---" -ForegroundColor Cyan
$basePath = Join-Path $PSScriptRoot "..\assets\img"

# Buscar solo dentro de las carpetas principales
$proyectos = Get-ChildItem -Path $basePath -Recurse -Directory | Where-Object { $_.Parent.Name -match 'academicos|profesionales' }

foreach ($carpeta in $proyectos) {
    Write-Host "Procesando carpeta: $($carpeta.Name)" -ForegroundColor Yellow
    $archivos = Get-ChildItem -Path $carpeta.FullName -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|mp4|mov)$' }
    
    if ($archivos.Count -eq 0) { continue }

    # ==============================================================
    # PASO 1: Renombrado Temporal (Evita colisiones de nombres)
    # ==============================================================
    $tempFiles = @()
    foreach ($archivo in $archivos) {
        # Genera un código aleatorio corto para evitar sobreescrituras
        $codigoRandom = [guid]::NewGuid().ToString().Substring(0,6)
        $tempName = "temp_$codigoRandom$($archivo.Extension)"
        
        # Renombra y guarda el nuevo objeto en la lista temporal
        $tempFile = Rename-Item -Path $archivo.FullName -NewName $tempName -PassThru
        $tempFiles += $tempFile
    }

    # ==============================================================
    # PASO 2: Renombrado Final (Secuencial y Limpio)
    # ==============================================================
    $contador = 1
    foreach ($archivo in $tempFiles) {
        # Formato {0:D2} asegura que los números del 1 al 9 tengan un '0' delante (01, 02...)
        $num = "{0:D2}" -f $contador
        $nuevoNombre = "$($carpeta.Name)_$num$($archivo.Extension)"
        
        Rename-Item -Path $archivo.FullName -NewName $nuevoNombre
        Write-Host " -> Renombrado: $nuevoNombre" -ForegroundColor Green
        $contador++
    }
}
Write-Host "--- PROCESO FINALIZADO SIN ERRORES ---" -ForegroundColor Cyan