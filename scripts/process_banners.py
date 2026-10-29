import os
from pathlib import Path
from PIL import Image

def process_banners():
    media_dir = Path(r"D:\Aplicaciones\likdin\media\seleccionados")
    maqueta_dir = media_dir / "maqueta urbana"
    out_dir = Path(r"d:\Aplicaciones\Portfolio AR\assets\img\banners")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 80)
    print("PROCESAMIENTO DE BANNERS WEBP 85% - ESPACIO NEGATIVO Y MÁXIMA FLUIDEZ")
    print(f"Salida: {out_dir}")
    print("=" * 80)
    
    # 1. banner-hero-space.webp
    # Concepto: Hero con espacio negativo a la izquierda (copyspace para títulos h1/h2) y modelo a la derecha.
    # Fuente: Architect_desk_with_city_model_a67346f2_2K.jpg (2400x1792)
    src_hero = media_dir / "Architect_desk_with_city_model_a67346f2_2K.jpg"
    dest_hero = out_dir / "banner-hero-space.webp"
    with Image.open(src_hero) as img:
        # Redimensionar ancho a 1920 manteniendo aspecto panorámico limpio
        w, h = img.size
        target_w = 1920
        target_h = int(h * target_w / w) # 1920x1433
        # Opcional: recortar ligeramente superior/inferior para dar formato 16:9 cinematográfico (1920x1080)
        # conservando el centro vertical del modelo
        crop_top = int((target_h - 1080) / 2)
        resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        cropped_16_9 = resized.crop((0, crop_top, target_w, crop_top + 1080))
        cropped_16_9.save(dest_hero, format="WEBP", quality=85, method=6)
        print(f"[OK] {dest_hero.name} | {cropped_16_9.size} | {dest_hero.stat().st_size / 1024:.1f} KB")

    # 2. banner-collections-desk.webp
    # Concepto: Mesa de arquitecto para Colecciones (modelo urbano detallado sobre plano).
    # Fuente: Architect_desk_with_city_model_5498afe9_2K.jpg (2400x1792)
    src_desk = media_dir / "Architect_desk_with_city_model_5498afe9_2K.jpg"
    dest_desk = out_dir / "banner-collections-desk.webp"
    with Image.open(src_desk) as img:
        w, h = img.size
        target_w = 1920
        target_h = int(h * target_w / w)
        crop_top = int((target_h - 1080) / 2)
        resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        cropped_16_9 = resized.crop((0, crop_top, target_w, crop_top + 1080))
        cropped_16_9.save(dest_desk, format="WEBP", quality=85, method=6)
        print(f"[OK] {dest_desk.name} | {cropped_16_9.size} | {dest_desk.stat().st_size / 1024:.1f} KB")

    # 3. banner-macro-topography.webp
    # Concepto: Banda divisoria macro / textura topográfica de relieve urbano de alta precisión.
    # Fuente: City_scale_model_flat_lay_2K_20261020154346.jpg (2048x2048)
    src_macro = maqueta_dir / "City_scale_model_flat_lay_2K_20261020154346.jpg"
    dest_macro = out_dir / "banner-macro-topography.webp"
    with Image.open(src_macro) as img:
        w, h = img.size # 2048x2048
        # Enfoque horizontal panorámico tipo franja divisoria o banner (1920x960 o 1920x800)
        # Recorte central panorámico
        crop_h = 1080
        crop_w = int(crop_h * 16 / 9) # 1920
        # Desde el centro de la imagen 2048x2048
        left = (w - 1920) // 2
        top = (h - 1080) // 2
        cropped = img.crop((left, top, left + 1920, top + 1080))
        cropped.save(dest_macro, format="WEBP", quality=85, method=6)
        print(f"[OK] {dest_macro.name} | {cropped.size} | {dest_macro.stat().st_size / 1024:.1f} KB")

    # 4. banner-workshop-craft.webp
    # Concepto: Taller en Santiago / modelo artesanal en mesa de trabajo.
    # Fuente: Architectural_model_on_worktable_50741d48_2K.jpg (1792x2400)
    src_craft = media_dir / "Architectural_model_on_worktable_50741d48_2K.jpg"
    dest_craft = out_dir / "banner-workshop-craft.webp"
    with Image.open(src_craft) as img:
        w, h = img.size # 1792x2400
        # Encuadre horizontal panorámico centrado en la maqueta sobre la mesa
        # Centrado en el área de mayor detalle de la mesa (tercio medio-bajo)
        crop_h = int(w * 9 / 16) # 1008
        top = int((h - crop_h) * 0.45) # 45% desde arriba para capturar el modelo en su totalidad
        cropped = img.crop((0, top, w, top + crop_h))
        resized = cropped.resize((1920, 1080), Image.Resampling.LANCZOS)
        resized.save(dest_craft, format="WEBP", quality=85, method=6)
        print(f"[OK] {dest_craft.name} | {resized.size} | {dest_craft.stat().st_size / 1024:.1f} KB")

    # 5. banner-lifestyle-living.webp
    # Concepto: Living interior contemporáneo / cuadro de relieve instalado en muro contemporáneo.
    # Fuente: City_relief_map_interior_design_2K_20261020164640.jpg o Interior_architecture_with_frame_2K_20261020164516.jpg
    # Usamos City_relief_map_interior_design_2K_20261020164640.jpg (2400x1792) o City_map_on_concrete_wall_d977a31c_2K.jpg
    src_living = maqueta_dir / "City_relief_map_interior_design_2K_20261020164640.jpg"
    if not src_living.exists():
        src_living = media_dir / "City_map_on_concrete_wall_d977a31c_2K.jpg"
    dest_living = out_dir / "banner-lifestyle-living.webp"
    with Image.open(src_living) as img:
        w, h = img.size
        target_w = 1920
        target_h = int(h * target_w / w)
        crop_top = int((target_h - 1080) / 2)
        resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        cropped_16_9 = resized.crop((0, crop_top, target_w, crop_top + 1080))
        cropped_16_9.save(dest_living, format="WEBP", quality=85, method=6)
        print(f"[OK] {dest_living.name} | {cropped_16_9.size} | {dest_living.stat().st_size / 1024:.1f} KB")

    print("=" * 80)
    print("VERIFICACIÓN DE PESOS (<350 KB REQUERIDO):")
    all_ok = True
    for p in out_dir.glob("banner-*.webp"):
        size_kb = p.stat().st_size / 1024
        status = "PASSED (<350 KB)" if size_kb < 350 else "WARNING (>350 KB)"
        if size_kb >= 350:
            all_ok = False
        print(f" • {p.name:<30} : {size_kb:>6.1f} KB -> {status}")
    print(f"Estado general de banners: {'TODOS ÓPTIMOS' if all_ok else 'REVISAR ALGUNOS'}")
    print("=" * 80)

if __name__ == "__main__":
    process_banners()
