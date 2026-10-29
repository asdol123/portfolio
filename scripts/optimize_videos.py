import os
import sys
import time
import subprocess
from pathlib import Path
import imageio_ffmpeg

def get_ffmpeg():
    return imageio_ffmpeg.get_ffmpeg_exe()

def check_faststart(filepath):
    """Verifica si el átomo 'moov' precede a 'mdat' para streaming instantáneo."""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(1024 * 64) # primeros 64KB
            if b'moov' in header:
                return True
    except Exception:
        pass
    return False

def get_video_info(ffmpeg_exe, filepath):
    proc = subprocess.run([ffmpeg_exe, "-i", str(filepath)], capture_output=True, text=True, errors="replace")
    stderr = proc.stderr
    info = {
        "size_bytes": filepath.stat().st_size,
        "size_mb": round(filepath.stat().st_size / (1024 * 1024), 2),
        "faststart": check_faststart(filepath)
    }
    return info

def run_ffmpeg_command(cmd, desc):
    print(f"\n[ENCODING] {desc}...")
    start = time.time()
    proc = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
    elapsed = round(time.time() - start, 2)
    if proc.returncode != 0:
        print(f"  [ERROR] Falló codificación de {desc}:")
        print(proc.stderr[-500:])
        return False
    print(f"  [OK] Completado en {elapsed}s")
    return True

def optimize_all():
    base_dir = Path(r"d:\Aplicaciones\Portfolio AR")
    videos_dir = base_dir / "videos"
    ffmpeg_exe = get_ffmpeg()
    
    print("=" * 80)
    print("PIPELINE DE OPTIMIZACIÓN MULTIMEDIA WEB - FFmpeg 7.1")
    print(f"Directorio de videos: {videos_dir}")
    print(f"Binario FFmpeg: {ffmpeg_exe}")
    print("=" * 80)
    
    # 1. Definición de tareas de transcodificación
    # Orígenes con patrones robustos
    def find_file(pattern):
        matches = list(videos_dir.glob(pattern))
        if not matches:
            raise FileNotFoundError(f"No se encontró archivo con patrón '{pattern}' en {videos_dir}")
        return matches[0]

    tasks = [
        # a) Video Hero Loop Principal (16:9 Horizontal)
        {
            "id": "hero_loop_mp4",
            "desc": "Hero Loop Principal MP4 (16:9 1080p, H.264 High, Faststart)",
            "src": find_file("*75205996*.mp4"),
            "dest": videos_dir / "hero-architectural-loop.mp4",
            "format": "mp4",
            "args": [
                "-y", "-i", "",
                "-vf", "scale=1920:1080",
                "-c:v", "libx264",
                "-profile:v", "high",
                "-preset", "slow",
                "-crf", "25",
                "-maxrate", "1350k",
                "-bufsize", "2700k",
                "-pix_fmt", "yuv420p",
                "-r", "24",
                "-an",
                "-movflags", "+faststart"
            ]
        },
        # a2) Video Hero Loop Principal WebM (VP9)
        {
            "id": "hero_loop_webm",
            "desc": "Hero Loop Principal WebM (16:9 1080p, VP9, CRF 34)",
            "src": find_file("*75205996*.mp4"),
            "dest": videos_dir / "hero-architectural-loop.webm",
            "format": "webm",
            "args": [
                "-y", "-i", "",
                "-vf", "scale=1920:1080",
                "-c:v", "libvpx-vp9",
                "-crf", "34",
                "-b:v", "1100k",
                "-r", "24",
                "-an"
            ]
        },
        # b) Video Showcase Taller y Colección (16:9 Horizontal)
        {
            "id": "workshop_loop_mp4",
            "desc": "Showcase Taller y Colección MP4 (16:9 1080p, H.264 High, Faststart)",
            "src": find_file("*738720f1*.mp4"),
            "dest": videos_dir / "workshop-collection-loop.mp4",
            "format": "mp4",
            "args": [
                "-y", "-i", "",
                "-vf", "scale=1920:1080",
                "-c:v", "libx264",
                "-profile:v", "high",
                "-preset", "slow",
                "-crf", "25.5",
                "-maxrate", "1250k",
                "-bufsize", "2500k",
                "-pix_fmt", "yuv420p",
                "-r", "24",
                "-an",
                "-movflags", "+faststart"
            ]
        },
        # c) Showcase Detalle de Relieve (9:16 Vertical)
        {
            "id": "showcase_relief_mp4",
            "desc": "Showcase Detalle de Relieve MP4 (9:16 1080x1920, H.264 High, Faststart)",
            "src": find_file("*c97943d5*.mp4"),
            "dest": videos_dir / "showcase-relief.mp4",
            "format": "mp4",
            "args": [
                "-y", "-i", "",
                "-vf", "scale=1080:1920",
                "-c:v", "libx264",
                "-profile:v", "high",
                "-preset", "slow",
                "-crf", "25.5",
                "-maxrate", "1250k",
                "-bufsize", "2500k",
                "-pix_fmt", "yuv420p",
                "-r", "24",
                "-an",
                "-movflags", "+faststart"
            ]
        },
        # d) Showcase Manufactura y Escala en Manos (9:16 Vertical)
        {
            "id": "showcase_frame_mp4",
            "desc": "Showcase Manufactura y Escala en Manos MP4 (9:16 1080x1920, H.264 High, Faststart)",
            "src": find_file("*e89d915e*.mp4"),
            "dest": videos_dir / "showcase-frame.mp4",
            "format": "mp4",
            "args": [
                "-y", "-i", "",
                "-vf", "scale=1080:1920",
                "-c:v", "libx264",
                "-profile:v", "high",
                "-preset", "slow",
                "-crf", "25",
                "-maxrate", "1300k",
                "-bufsize", "2600k",
                "-pix_fmt", "yuv420p",
                "-r", "24",
                "-an",
                "-movflags", "+faststart"
            ]
        },
        # e) Showcase Espacio / Instalación en Muro (9:16 Vertical)
        {
            "id": "lifestyle_hanging_mp4",
            "desc": "Showcase Espacio / Instalación en Muro MP4 (9:16 1080x1920, H.264 High, Faststart)",
            "src": find_file("*dc746e83*.mp4"),
            "dest": videos_dir / "lifestyle-hanging.mp4",
            "format": "mp4",
            "args": [
                "-y", "-i", "",
                "-vf", "scale=1080:1920",
                "-c:v", "libx264",
                "-profile:v", "high",
                "-preset", "slow",
                "-crf", "24.5",
                "-maxrate", "1450k",
                "-bufsize", "2900k",
                "-pix_fmt", "yuv420p",
                "-r", "24",
                "-an",
                "-movflags", "+faststart"
            ]
        }
    ]
    
    results = []
    
    for task in tasks:
        cmd = [ffmpeg_exe]
        # Replace input placeholder
        args = list(task["args"])
        idx_i = args.index("-i")
        args[idx_i + 1] = str(task["src"])
        cmd.extend(args)
        cmd.append(str(task["dest"]))
        
        ok = run_ffmpeg_command(cmd, task["desc"])
        if ok and task["dest"].exists():
            info = get_video_info(ffmpeg_exe, task["dest"])
            results.append({
                "id": task["id"],
                "name": task["dest"].name,
                "orig_name": task["src"].name,
                "size_mb": info["size_mb"],
                "size_bytes": info["size_bytes"],
                "faststart": info["faststart"]
            })
            print(f"     -> Archivo generado: {task['dest'].name} ({info['size_mb']} MB, Faststart: {info['faststart']})")
        else:
            print(f"     -> Error al generar {task['dest'].name}")
            
    # f) Verificar reel-volcanes.mp4
    volcanes_path = videos_dir / "reel-volcanes.mp4"
    if volcanes_path.exists():
        info_v = get_video_info(ffmpeg_exe, volcanes_path)
        print(f"\n[STATUS] reel-volcanes.mp4: {info_v['size_mb']} MB | Faststart OK: {info_v['faststart']}")
        if not info_v["faststart"]:
            print("  [FIX] Aplicando +faststart a reel-volcanes.mp4...")
            tmp_volc = videos_dir / "reel-volcanes_faststart.mp4"
            cmd_fs = [ffmpeg_exe, "-y", "-i", str(volcanes_path), "-c", "copy", "-movflags", "+faststart", str(tmp_volc)]
            subprocess.run(cmd_fs, check=True)
            tmp_volc.replace(volcanes_path)
            print("  [FIX OK] reel-volcanes.mp4 actualizado con +faststart.")
            info_v = get_video_info(ffmpeg_exe, volcanes_path)
            
        results.append({
            "id": "reel_volcanes",
            "name": volcanes_path.name,
            "orig_name": volcanes_path.name,
            "size_mb": info_v["size_mb"],
            "size_bytes": info_v["size_bytes"],
            "faststart": info_v["faststart"]
        })
        
    print("\n" + "=" * 80)
    print("RESUMEN DE RESULTADOS DE OPTIMIZACIÓN DE VIDEO")
    print("=" * 80)
    for r in results:
        print(f" • {r['name']:<32} | {r['size_mb']:>5.2f} MB | Faststart: {'SÍ' if r['faststart'] else 'N/A (WebM)'}")
    print("=" * 80)

if __name__ == "__main__":
    optimize_all()
