Write-Host "--- ACTUALIZANDO BASE DE DATOS (VERSION DEFINITIVA) ---" -ForegroundColor Cyan
$existingData = @{}
$rutaDatos = Join-Path $PSScriptRoot "..\data\proyectos.js"

# 1. Leer datos existentes
if (Test-Path $rutaDatos) {
    $contenido = Get-Content $rutaDatos -Raw -Encoding UTF8
    $bloques = $contenido -split 'id:\s*"'
    for ($i = 1; $i -lt $bloques.Length; $i++) {
        $bloque = $bloques[$i]
        $proyectoId = ($bloque -split '"')[0]
        $existingData[$proyectoId] = @{
            titulo = if($bloque -match 'titulo:\s*"([^"]+)"') { $Matches[1] } else { $proyectoId.ToUpper().Replace("-", " ") }
            year = if($bloque -match 'year:\s*"([^"]+)"') { $Matches[1] } else { "2026" }
            desc = if($bloque -match 'descripcion:\s*"([^"]+)"') { $Matches[1] } else { "Descripción en desarrollo..." }
            clase = if($bloque -match 'clase_css:\s*"([^"]*)"') { $Matches[1] } else { "" }
        }
    }
}

# 2. Generar nuevos datos
$jsItems = @()
$base = Join-Path $PSScriptRoot "..\assets\img"

foreach ($cat in @("academicos", "profesionales")) {
    $rutaCat = Join-Path $base $cat
    if (-not (Test-Path $rutaCat)) { continue }
    
    foreach ($carpeta in Get-ChildItem $rutaCat -Directory) {
        $fotos = Get-ChildItem $carpeta.FullName -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png)$' }
        if ($fotos.Count -eq 0) { continue }
        
        $rutas = ($fotos | ForEach-Object { "assets/img/$cat/$($carpeta.Name)/$($_.Name)" })
        $fotosStr = ($rutas | ForEach-Object { '"' + $_ + '"' }) -join ", "
        
        $datos = $existingData[$carpeta.Name]
        $item = "    {
        id: `"$($carpeta.Name)`",
        tipo: `"$cat`",
        titulo: `"$($datos.titulo)`",
        year: `"$($datos.year)`",
        descripcion: `"$($datos.desc)`",
        imagen_principal: `"$($rutas[0])`",
        galeria: [$fotosStr],
        clase_css: `"$($datos.clase)`"
    }"
        $jsItems += $item
    }
}

# 3. Guardar archivo limpio (Sin saltos de línea corruptos)
$output = "const misProyectos = [`n" + ($jsItems -join ",`n") + "`n];"
[System.IO.File]::WriteAllText($rutaDatos, $output, [System.Text.Encoding]::UTF8)
Write-Host "¡Portafolio actualizado con éxito!" -ForegroundColor Green