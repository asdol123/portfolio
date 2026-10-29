#!/usr/bin/env python3
"""
ALZADO ROJO · AR ARQ SpA
Script de Ingesta y Optimizacion de Activos: Coleccion "Volcanes de Chile"
Procesa imagenes con PIL a 1200x900 con limites estrictos de peso (< 120 KB / < 100 KB)
y optimiza el reel en MP4 con H.264 + FastStart para streaming web.
"""

import os
import sys
import subprocess
from PIL import Image, ImageOps

try:
    import imageio_ffmpeg
    FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_BIN = "ffmpeg"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_BASE = r"D:\Aplicaciones\likdin\media\seleccionados"

IMAGES_CONFIG = [
    {
        "src": os.path.join(SRC_BASE, "Architect_model_on_worktable_78790579_2K.jpg"),
        "dest": os.path.join(BASE_DIR, "catalog", "volcan-villarrica-marco.jpg"),
        "target_size": (1200, 900),
        "centering": (0.5, 0.52),
        "initial_q": 82,
        "max_kb": 120.0,
        "desc": "Volcán Villarrica en Marco de Taller"
    },
    {
        "src": os.path.join(SRC_BASE, "carrusel_maquetas", "slide_05.jpg"),
        "dest": os.path.join(BASE_DIR, "catalog", "volcan-osorno-shadowbox.jpg"),
        "target_size": (1200, 900),
        "centering": (0.5, 0.44),
        "initial_q": 82,
        "max_kb": 100.0,
        "desc": "Volcán Osorno Shadowbox Modular 4 Paneles"
    },
    {
        "src": os.path.join(SRC_BASE, "carrusel_maquetas", "slide_02.jpg"),
        "dest": os.path.join(BASE_DIR, "catalog", "volcan-villarrica-detalle.jpg"),
        "target_size": (1200, 900),
        "centering": (0.5, 0.48),
        "initial_q": 82,
        "max_kb": 100.0,
        "desc": "Volcán Villarrica Detalle Curvas de Nivel"
    }
]

VIDEO_CONFIG = {
    "src": os.path.join(SRC_BASE, "alzado_rojo_reel_volcanes_sin_musica_14s.mp4"),
    "dest": os.path.join(BASE_DIR, "videos", "reel-volcanes.mp4")
}

def optimize_image(cfg):
    src_path = cfg["src"]
    dest_path = cfg["dest"]
    target_size = cfg["target_size"]
    max_kb = cfg["max_kb"]
    centering = cfg["centering"]

    print(f"\n[*] Procesando imagen: {os.path.basename(dest_path)} ({cfg['desc']})")
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Archivo origen no encontrado: {src_path}")

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode != "RGB":
            im = im.convert("RGB")

        # Ajuste y recorte exacto a target_size respetando el centro de gravedad optico
        cropped = ImageOps.fit(im, target_size, method=Image.Resampling.LANCZOS, centering=centering)

        # Ajuste dinamico de calidad para cumplir el limite max_kb preservando fidelidad
        temp_dest = dest_path + ".tmp"
        selected_q = cfg["initial_q"]
        final_kb = 0.0

        for q in range(cfg["initial_q"], 30, -1):
            cropped.save(
                temp_dest,
                format="JPEG",
                quality=q,
                optimize=True,
                progressive=True,
                subsampling=2
            )
            final_kb = os.path.getsize(temp_dest) / 1024.0
            selected_q = q
            if final_kb <= max_kb:
                break

        # Reemplazo atomico
        os.replace(temp_dest, dest_path)
        print(f"    [OK] Guardado: {dest_path}")
        print(f"    Dimensiones: {target_size[0]}x{target_size[1]} px | Calidad: {selected_q}% | Peso: {final_kb:.1f} KB (limite < {max_kb} KB)")

def optimize_video():
    src_path = VIDEO_CONFIG["src"]
    dest_path = VIDEO_CONFIG["dest"]

    print(f"\n[*] Procesando video: {os.path.basename(dest_path)}")
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Video origen no encontrado: {src_path}")

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    cmd = [
        FFMPEG_BIN, "-y",
        "-i", src_path,
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-an",
        dest_path
    ]

    print("    Ejecutando transcodificacion FFmpeg H.264 + FastStart...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg falló al codificar el video:\n{res.stderr}")

    orig_mb = os.path.getsize(src_path) / (1024.0 * 1024.0)
    dest_mb = os.path.getsize(dest_path) / (1024.0 * 1024.0)
    reduction = (1.0 - (dest_mb / orig_mb)) * 100.0
    print(f"    [OK] Video optimizado con exito: {dest_path}")
    print(f"    Tamano: {orig_mb:.2f} MB -> {dest_mb:.2f} MB (-{reduction:.1f}%) | Flag: +faststart")

def main():
    print("=" * 70)
    print("ALZADO ROJO - INGESTA DE ACTIVOS: COLECCION VOLCANES DE CHILE")
    print("=" * 70)

    for img_cfg in IMAGES_CONFIG:
        optimize_image(img_cfg)

    optimize_video()

    print("\n" + "=" * 70)
    print("PROCESO FINALIZADO CON EXITO")
    print("=" * 70)

if __name__ == "__main__":
    main()
