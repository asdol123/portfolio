import os
import sys
import re
import json
import subprocess
from pathlib import Path

def get_ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        print(f"Error getting ffmpeg: {e}")
        return "ffmpeg"

def parse_ffmpeg_output(stderr_text):
    info = {
        "duration": None,
        "duration_sec": 0.0,
        "bitrate_kbps": None,
        "video_codec": None,
        "video_profile": None,
        "pix_fmt": None,
        "width": None,
        "height": None,
        "fps": None,
        "aspect_ratio": None,
        "has_audio": False,
        "audio_codec": None,
    }
    
    # Duration: 00:00:14.50, start: 0.000000, bitrate: 2957 kb/s
    dur_match = re.search(r"Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?),\s*start:.*bitrate:\s*(\d+)\s*kb/s", stderr_text)
    if dur_match:
        h, m, s, br = dur_match.groups()
        info["duration"] = f"{h}:{m}:{s}"
        info["duration_sec"] = round(int(h)*3600 + int(m)*60 + float(s), 2)
        info["bitrate_kbps"] = int(br)
    
    # Stream #0:0...: Video: h264 (High) (avc1...), yuv420p..., 1080x1920, 2954 kb/s, 24 fps...
    video_match = re.search(r"Stream #\d+:\d+.*?: Video:\s*([^\s,]+)(?:\s*\(([^)]+)\))?.*?,\s*([^\s,]+).*?,\s*(\d+)x(\d+)(?:.*?,\s*(\d+(?:\.\d+)?)\s*fps)?", stderr_text)
    if video_match:
        codec, profile, pix_fmt, w, h, fps = video_match.groups()
        info["video_codec"] = codec
        info["video_profile"] = profile
        info["pix_fmt"] = pix_fmt
        w = int(w)
        h = int(h)
        info["width"] = w
        info["height"] = h
        if fps:
            info["fps"] = float(fps)
        else:
            # check tbr or fps
            tbr_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:fps|tbr)", stderr_text)
            if tbr_match:
                info["fps"] = float(tbr_match.group(1))

        # Determine aspect ratio
        def gcd(a, b):
            while b:
                a, b = b, a % b
            return a
        g = gcd(w, h)
        simple_w = w // g
        simple_h = h // g
        # Standardize known aspect ratios
        ratio = round(w / h, 3)
        if abs(ratio - 1.777) < 0.05:
            ar_label = "16:9 (Horizontal / Landscape)"
        elif abs(ratio - 0.562) < 0.05:
            ar_label = "9:16 (Vertical / Reels)"
        elif abs(ratio - 1.0) < 0.05:
            ar_label = "1:1 (Cuadrado)"
        elif abs(ratio - 0.8) < 0.05:
            ar_label = "4:5 (Vertical feed)"
        elif abs(ratio - 1.333) < 0.05:
            ar_label = "4:3 (Estándar)"
        elif abs(ratio - 2.39) < 0.1:
            ar_label = "21:9 / 2.39:1 (Ultrawide Cinemático)"
        else:
            ar_label = f"{simple_w}:{simple_h} (~{ratio:.2f}:1)"
        info["aspect_ratio"] = ar_label

    # Audio check
    audio_match = re.search(r"Stream #\d+:\d+.*?: Audio:\s*([^\s,]+)", stderr_text)
    if audio_match:
        info["has_audio"] = True
        info["audio_codec"] = audio_match.group(1)
        
    return info

def check_moov_atom(filepath):
    """Check if moov atom is before mdat (faststart enabled for web streaming)."""
    if filepath.suffix.lower() == '.webm':
        return "N/A (WebM VP9 Stream Nativo)"
    try:
        with open(filepath, 'rb') as f:
            header = f.read(4096 * 16) # read first 64KB
            if b'moov' in header:
                return "Inicio (Faststart OK)"
            else:
                return "Al final (Requiere Faststart)"
    except Exception as e:
        return f"Error: {e}"

def inspect_all():
    videos_dir = Path(r"d:\Aplicaciones\Portfolio AR\videos")
    ffmpeg_exe = get_ffmpeg()
    
    print("=" * 80)
    print(f"DIAGNÓSTICO EXHAUSTIVO DE VIDEOS EN: {videos_dir}")
    print(f"FFMPEG DETECTADO: {ffmpeg_exe}")
    print("=" * 80)
    
    files = sorted([f for f in videos_dir.iterdir() if f.is_file() and f.suffix.lower() in ('.mp4', '.mov', '.webm', '.m4v')])
    
    results = []
    
    for f in files:
        size_bytes = f.stat().st_size
        size_mb = round(size_bytes / (1024 * 1024), 2)
        
        # run ffmpeg
        proc = subprocess.run([ffmpeg_exe, "-i", str(f)], capture_output=True, text=True, errors="replace")
        meta = parse_ffmpeg_output(proc.stderr)
        moov_status = check_moov_atom(f)
        
        item = {
            "filename": f.name,
            "size_mb": size_mb,
            "size_bytes": size_bytes,
            "duration": meta["duration"],
            "duration_sec": meta["duration_sec"],
            "resolution": f"{meta['width']}x{meta['height']}" if meta['width'] else "Desconocido",
            "width": meta['width'],
            "height": meta['height'],
            "aspect_ratio": meta["aspect_ratio"],
            "fps": meta["fps"],
            "video_codec": f"{meta['video_codec']} ({meta['video_profile']})" if meta['video_profile'] else meta['video_codec'],
            "bitrate_kbps": meta["bitrate_kbps"],
            "has_audio": meta["has_audio"],
            "audio_codec": meta["audio_codec"],
            "moov_atom": moov_status
        }
        results.append(item)
    
    # Save json report
    out_json = videos_dir / "_video_inspection_report.json"
    with open(out_json, "w", encoding="utf-8") as jf:
        json.dump(results, jf, indent=2, ensure_ascii=False)
        
    print(f"\nSe encontraron {len(results)} videos analizados. Reporte JSON guardado en: {out_json}\n")
    
    # Format and print clean table
    header_fmt = "{:<4} | {:<48} | {:<7} | {:<10} | {:<6} | {:<5} | {:<18} | {:<8}"
    row_fmt    = "{:<4} | {:<48} | {:<7} | {:<10} | {:<6} | {:<5} | {:<18} | {:<8}"
    
    print("-" * 120)
    print(header_fmt.format("#", "Nombre de Archivo", "MB", "Resolución", "Dur(s)", "FPS", "Aspect Ratio", "Faststart"))
    print("-" * 120)
    
    for idx, item in enumerate(results, 1):
        fname = item['filename']
        if len(fname) > 48:
            fname = fname[:45] + "..."
        print(row_fmt.format(
            idx,
            fname,
            f"{item['size_mb']} MB",
            item['resolution'],
            f"{item['duration_sec']}s",
            f"{item['fps']}",
            item['aspect_ratio'][:18] if item['aspect_ratio'] else "-",
            "OK" if "OK" in item['moov_atom'] else "NO"
        ))
    print("-" * 120)
    
    # Print detail of each video
    print("\n" + "=" * 80)
    print("DETALLE COMPLETO Y RECOMENDACIÓN TÉCNICA")
    print("=" * 80)
    for idx, item in enumerate(results, 1):
        print(f"\n[{idx}] {item['filename']}")
        print(f"    • Peso: {item['size_mb']} MB ({item['size_bytes']:,} bytes)")
        print(f"    • Resolución: {item['resolution']} | Proporción: {item['aspect_ratio']}")
        print(f"    • Duración: {item['duration']} ({item['duration_sec']} segundos)")
        print(f"    • FPS: {item['fps']} | Bitrate: {item['bitrate_kbps']} kbps")
        print(f"    • Códec: {item['video_codec']} | Audio: {'Sí (' + str(item['audio_codec']) + ')' if item['has_audio'] else 'Sin audio (Silent)'}")
        print(f"    • Estructura MP4: {item['moov_atom']}")

if __name__ == "__main__":
    inspect_all()
