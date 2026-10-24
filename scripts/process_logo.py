#!/usr/bin/env python3
"""
ALZADO ROJO - Logo Processing & Web Optimization Pipeline
Processes official brand logo from Google Drive to web-optimized assets.
"""

import os
import shutil
import hashlib
import numpy as np
from PIL import Image

SRC_LOGO = r"H:\Mi unidad\ALZADOR ROJO SPA\ALZADO ROJO\logo.png"
SRC_LOGO_FULL = r"H:\Mi unidad\ALZADOR ROJO SPA\ALZADO ROJO\5.png"
SRC_LOGO_CORP = r"H:\Mi unidad\ALZADOR ROJO SPA\ALZADO ROJO\6.png"

DEST_DIR = r"D:\Aplicaciones\Portfolio AR\images"
DEST_LOGO = os.path.join(DEST_DIR, "logo.png")
DEST_LOGO_ORIGINAL = os.path.join(DEST_DIR, "logo-original.png")
DEST_LOGO_SQUARE = os.path.join(DEST_DIR, "logo-square.png")
DEST_LOGO_WEBP = os.path.join(DEST_DIR, "logo.webp")
DEST_LOGO_FULL = os.path.join(DEST_DIR, "logo-full.png")

def calculate_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def make_transparent_and_clean(img_path):
    orig = Image.open(img_path).convert("RGB")
    arr = np.array(orig)
    
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)
    
    h, w, _ = arr.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    
    # Classify pixels:
    # Red stroke: (r - g) > 25 and not pure white
    is_red = ((r - g) > 25) & (g < 254.5)
    # Black stroke: (r - g) <= 25 and not pure white
    is_black = ((r - g) <= 25) & (g < 254.5)
    
    # Alpha calculations:
    alpha = np.zeros((h, w), dtype=np.float32)
    # For red pixels: G moves from 49 (solid) to 255 (background white)
    alpha[is_red] = (255.0 - g[is_red]) / (255.0 - 49.0) * 255.0
    # For black pixels: G moves from 0 (solid) to 255 (background white)
    alpha[is_black] = (255.0 - g[is_black])
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    
    # Assign defringed foreground colors
    rgba[is_red, 0] = 255
    rgba[is_red, 1] = 49
    rgba[is_red, 2] = 49
    rgba[is_red, 3] = alpha[is_red]
    
    rgba[is_black, 0] = 0
    rgba[is_black, 1] = 0
    rgba[is_black, 2] = 0
    rgba[is_black, 3] = alpha[is_black]
    
    # Interior transitions between red and black (opaque detail)
    is_transition = (r > 20) & (r < 250) & (alpha > 240)
    rgba[is_transition, :3] = arr[is_transition]
    rgba[is_transition, 3] = 255
    
    return Image.fromarray(rgba, mode="RGBA")

def main():
    os.makedirs(DEST_DIR, exist_ok=True)
    print("=" * 60)
    print("ALZADO ROJO · LOGO EXTRACTION & OPTIMIZATION")
    print("=" * 60)
    
    # 1. Verify source
    if not os.path.exists(SRC_LOGO):
        raise FileNotFoundError(f"Source logo not found at: {SRC_LOGO}")
    
    src_size = os.path.getsize(SRC_LOGO)
    print(f"[*] Found source logo: {SRC_LOGO}")
    print(f"    Size: {src_size} bytes ({src_size / 1024:.2f} KB)")
    
    # 2. Copy untouched 1:1 original
    shutil.copy2(SRC_LOGO, DEST_LOGO_ORIGINAL)
    print(f"[+] Saved pristine copy -> {DEST_LOGO_ORIGINAL}")
    
    # 3. Process transparent trimmed web version (primary logo.png)
    trans_img = make_transparent_and_clean(SRC_LOGO)
    bbox = trans_img.getbbox()
    cropped = trans_img.crop(bbox)
    
    # Save optimized PNG
    cropped.save(DEST_LOGO, "PNG", optimize=True)
    cropped.save(DEST_LOGO_WEBP, "WEBP", lossless=True, quality=100)
    
    # 4. Create square version with centered mark
    # Mark is 1242 x 1619. Let's make an 1800 x 1800 square canvas with centered mark (~90px padding)
    sq_size = max(cropped.width, cropped.height) + 160
    square_img = Image.new("RGBA", (sq_size, sq_size), (0, 0, 0, 0))
    offset_x = (sq_size - cropped.width) // 2
    offset_y = (sq_size - cropped.height) // 2
    square_img.paste(cropped, (offset_x, offset_y), cropped)
    square_img.save(DEST_LOGO_SQUARE, "PNG", optimize=True)
    
    # 5. Process full lockup from 5.png if available
    if os.path.exists(SRC_LOGO_FULL):
        full_trans = make_transparent_and_clean(SRC_LOGO_FULL)
        full_bbox = full_trans.getbbox()
        full_cropped = full_trans.crop(full_bbox)
        full_cropped.save(DEST_LOGO_FULL, "PNG", optimize=True)
        print(f"[+] Processed full brand lockup -> {DEST_LOGO_FULL} ({full_cropped.width}x{full_cropped.height})")
    
    # 6. Report metrics
    print("\n" + "=" * 60)
    print("OPTIMIZED ASSETS SUMMARY")
    print("=" * 60)
    
    assets = [
        ("logo.png (Web Primary)", DEST_LOGO),
        ("logo-original.png (Pristine 1:1)", DEST_LOGO_ORIGINAL),
        ("logo-square.png (Centered Square)", DEST_LOGO_SQUARE),
        ("logo.webp (Modern Lossless)", DEST_LOGO_WEBP),
    ]
    if os.path.exists(DEST_LOGO_FULL):
        assets.append(("logo-full.png (Full Lockup)", DEST_LOGO_FULL))
        
    for label, path in assets:
        with Image.open(path) as im:
            w, h = im.size
            mode = im.mode
            fmt = im.format
        size_bytes = os.path.getsize(path)
        sha = calculate_sha256(path)[:12]
        print(f"\nAsset: {label}")
        print(f"  File: {path}")
        print(f"  Dimensions: {w} x {h} px")
        print(f"  Format / Mode: {fmt} / {mode}")
        print(f"  Size: {size_bytes} bytes ({size_bytes / 1024:.2f} KB)")
        print(f"  SHA256 (prefix): {sha}...")

if __name__ == "__main__":
    main()
