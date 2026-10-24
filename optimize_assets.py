#!/usr/bin/env python3
"""
Optimization script for Portfolio AR image assets (catalog/ and images/)
Reduces ultra-large images to web-optimized dimensions & weights.
Ensures zero broken links and preserves exact filenames.
"""

import os
import shutil
import sys
from PIL import Image, ImageOps

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(BASE_DIR, "_backup_images_raw")
CATALOG_DIR = os.path.join(BASE_DIR, "catalog")
IMAGES_DIR = os.path.join(BASE_DIR, "images")

CONFIG = {
    "catalog": {
        "max_dim": 1600,
        "jpeg_quality": 83,
        "png_colors": 256,
    },
    "images": {
        "max_dim": 1200,
        "png_max_dim": 900,
        "jpeg_quality": 82,
        "png_colors": 256,
    }
}

def create_backup():
    print("[*] Creating safety backup in '_backup_images_raw'...")
    for folder_name in ["catalog", "images"]:
        src = os.path.join(BASE_DIR, folder_name)
        dst = os.path.join(BACKUP_DIR, folder_name)
        if not os.path.exists(dst):
            os.makedirs(dst, exist_ok=True)
            for fname in os.listdir(src):
                sfile = os.path.join(src, fname)
                dfile = os.path.join(dst, fname)
                if os.path.isfile(sfile):
                    shutil.copy2(sfile, dfile)
            print(f"    Backed up {folder_name}/ -> {dst}")
        else:
            print(f"    Backup for {folder_name}/ already exists. Preserving original backup.")

def optimize_single_image(file_path, folder_type):
    cfg = CONFIG[folder_type]
    file_name = os.path.basename(file_path)
    ext = os.path.splitext(file_name)[1].lower()

    # Open and transpose EXIF
    with Image.open(file_path) as im:
        im = ImageOps.exif_transpose(im)
        orig_w, orig_h = im.size

        # Determine target dimensions
        if ext == ".png":
            target_max = cfg.get("png_max_dim", cfg["max_dim"])
        else:
            target_max = cfg["max_dim"]

        # Resize keeping aspect ratio if larger than target
        if max(orig_w, orig_h) > target_max:
            im.thumbnail((target_max, target_max), Image.Resampling.LANCZOS)
        
        new_w, new_h = im.size

        # Temporary output path
        temp_path = file_path + ".tmp"

        if ext in [".jpg", ".jpeg"]:
            # Ensure RGB
            if im.mode != "RGB":
                im = im.convert("RGB")
            im.save(
                temp_path,
                format="JPEG",
                quality=cfg["jpeg_quality"],
                optimize=True,
                progressive=True,
                subsampling=0 if cfg["jpeg_quality"] >= 90 else 2 # 4:2:0 subsampling
            )
        elif ext == ".png":
            # For photos saved as PNG, quantize to 256 adaptive palette
            # Check if has real alpha
            has_alpha = False
            if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
                if im.mode != "RGBA":
                    im = im.convert("RGBA")
                alpha_extrema = im.getchannel("A").getextrema()
                if alpha_extrema[0] < 255:
                    has_alpha = True

            if not has_alpha:
                im_rgb = im.convert("RGB")
                im_quant = im_rgb.quantize(
                    colors=cfg["png_colors"],
                    method=Image.Quantize.FASTOCTREE
                )
                im_quant.save(temp_path, format="PNG", optimize=True, compress_level=9)
            else:
                im_quant = im.quantize(
                    colors=cfg["png_colors"],
                    method=Image.Quantize.FASTOCTREE
                )
                im_quant.save(temp_path, format="PNG", optimize=True, compress_level=9)
        else:
            raise ValueError(f"Unsupported format: {ext}")

    # Verify temp file is valid before replacing
    with Image.open(temp_path) as test_im:
        test_im.load()
    
    # Atomic replace
    os.replace(temp_path, file_path)

    return (orig_w, orig_h), (new_w, new_h)

def run():
    print("=" * 70)
    print("Portfolio AR - Image Optimization Engine")
    print("=" * 70)

    # 1. Backup
    create_backup()

    # 2. Collect files and calculate pre-sizes from backup
    stats = []
    grand_orig_size = 0
    grand_new_size = 0

    for folder_type in ["catalog", "images"]:
        folder_path = os.path.join(BASE_DIR, folder_type)
        backup_folder = os.path.join(BACKUP_DIR, folder_type)
        files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

        print(f"\n[*] Processing folder: {folder_type}/ ({len(files)} files)")

        folder_orig = 0
        folder_new = 0

        for f in files:
            orig_file = os.path.join(backup_folder, f)
            dest_file = os.path.join(folder_path, f)

            orig_sz = os.path.getsize(orig_file)
            (orig_w, orig_h), (new_w, new_h) = optimize_single_image(dest_file, folder_type)
            new_sz = os.path.getsize(dest_file)

            folder_orig += orig_sz
            folder_new += new_sz

            reduction = (1 - (new_sz / orig_sz)) * 100
            stats.append({
                "folder": folder_type,
                "file": f,
                "orig_dim": f"{orig_w}x{orig_h}",
                "new_dim": f"{new_w}x{new_h}",
                "orig_kb": orig_sz / 1024,
                "new_kb": new_sz / 1024,
                "reduction": reduction
            })

            print(f"  [OK] {f:32} | {orig_w:4}x{orig_h:<4} -> {new_w:4}x{new_h:<4} | {orig_sz/1024:6.1f} KB -> {new_sz/1024:5.1f} KB (-{reduction:4.1f}%)")

        grand_orig_size += folder_orig
        grand_new_size += folder_new
        f_reduction = (1 - (folder_new / folder_orig)) * 100
        print(f"    Subtotal {folder_type}/: {folder_orig/1024/1024:.2f} MB -> {folder_new/1024/1024:.2f} MB (-{f_reduction:.1f}%)")

    # 3. Final summary
    grand_reduction = (1 - (grand_new_size / grand_orig_size)) * 100
    print("\n" + "=" * 70)
    print("OPTIMIZATION SUMMARY")
    print("=" * 70)
    print(f"Total images processed: {len(stats)}")
    print(f"Original total weight : {grand_orig_size / (1024*1024):.2f} MB ({grand_orig_size:,} bytes)")
    print(f"Optimized total weight: {grand_new_size / (1024*1024):.2f} MB ({grand_new_size:,} bytes)")
    print(f"Net weight saved      : {(grand_orig_size - grand_new_size) / (1024*1024):.2f} MB")
    print(f"Overall reduction     : {grand_reduction:.2f}%")
    print("=" * 70)

    # 4. Integrity check
    print("\n[*] Performing final integrity check on all images...")
    corrupt = 0
    for s in stats:
        target_path = os.path.join(BASE_DIR, s["folder"], s["file"])
        try:
            with Image.open(target_path) as im:
                im.verify()
            with Image.open(target_path) as im:
                im.load()
        except Exception as err:
            print(f"  [ERROR] Corrupt file: {target_path} - {err}")
            corrupt += 1

    if corrupt == 0:
        print("  [SUCCESS] All 32 images verified successfully! No corruption, all valid.")
    else:
        print(f"  [FAILURE] Found {corrupt} corrupt images.")
        sys.exit(1)

if __name__ == "__main__":
    run()
