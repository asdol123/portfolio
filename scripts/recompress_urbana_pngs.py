#!/usr/bin/env python3
"""
Recompression script for BUG-02:
Optimizes images/urbana-01.png and images/urbana-02.png
Ensures dimensions <= 900px width, quantized PNG palette (FASTOCTREE),
lossless compression level 9 + optimize, resulting in strict size < 250 KB.
"""

import os
import sys
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE_DIR, "images")
BACKUP_DIR = os.path.join(BASE_DIR, "_backup_images_raw", "images")

TARGET_FILES = ["urbana-01.png", "urbana-02.png"]
MAX_WIDTH = 900
SIZE_LIMIT_KB = 250.0

def process_image(filename):
    print(f"\n[-] Processing: {filename}")
    
    # Check if raw backup is available to preserve highest possible fidelity
    backup_path = os.path.join(BACKUP_DIR, filename)
    dest_path = os.path.join(IMAGES_DIR, filename)
    
    source_path = backup_path if os.path.exists(backup_path) else dest_path
    print(f"    Source: {source_path}")
    
    with Image.open(source_path) as im:
        im_rgb = im.convert("RGB")
        w, h = im_rgb.size
        print(f"    Original dimensions: {w}x{h}")
        
        # Resize if width exceeds MAX_WIDTH
        if w > MAX_WIDTH:
            new_w = MAX_WIDTH
            new_h = int(round(h * (new_w / w)))
            im_resized = im_rgb.resize((new_w, new_h), Image.Resampling.LANCZOS)
            print(f"    Resized dimensions: {new_w}x{new_h}")
        else:
            im_resized = im_rgb
            print(f"    Dimensions kept at: {w}x{h}")
        
        # Quantize using FASTOCTREE (256 colors) for optimal palette and compression
        quantized = im_resized.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
        
        # Save to temporary path first
        temp_path = dest_path + ".tmp"
        quantized.save(temp_path, format="PNG", optimize=True, compress_level=9)
    
    # Verify file opens cleanly and has no corruptions
    with Image.open(temp_path) as test_im:
        test_im.verify()
    
    with Image.open(temp_path) as test_im:
        test_im.load()
        out_w, out_h = test_im.size
        out_mode = test_im.mode
        out_format = test_im.format
    
    # Check final size
    size_bytes = os.path.getsize(temp_path)
    size_kb = size_bytes / 1024.0
    print(f"    Output: {out_w}x{out_h}, Mode: {out_mode}, Format: {out_format}")
    print(f"    File size: {size_bytes} bytes ({size_kb:.2f} KB)")
    
    if size_kb >= SIZE_LIMIT_KB:
        os.remove(temp_path)
        raise ValueError(f"CRITICAL: {filename} size {size_kb:.2f} KB exceeds limit of {SIZE_LIMIT_KB} KB!")
    
    # Replace destination file atomically
    os.replace(temp_path, dest_path)
    print(f"    [OK] Successfully replaced {dest_path} (< {SIZE_LIMIT_KB} KB)")
    return size_bytes, size_kb

def main():
    print("=" * 60)
    print("BUG-02 Image Recompression Engine")
    print(f"Target limit: < {SIZE_LIMIT_KB} KB per file")
    print("=" * 60)
    
    results = {}
    for fname in TARGET_FILES:
        bytes_sz, kb_sz = process_image(fname)
        results[fname] = (bytes_sz, kb_sz)
    
    print("\n" + "=" * 60)
    print("FINAL SUMMARY & VERIFICATION:")
    all_passed = True
    for fname, (b_sz, kb_sz) in results.items():
        passed = kb_sz < SIZE_LIMIT_KB
        status = "PASSED" if passed else "FAILED"
        print(f" - {fname}: {kb_sz:.2f} KB ({b_sz} bytes) -> {status}")
        if not passed:
            all_passed = False
            
    print("=" * 60)
    if not all_passed:
        sys.exit(1)
    print("All images recompressed and verified successfully!")

if __name__ == "__main__":
    main()
