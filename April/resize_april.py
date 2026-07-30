"""
Resize all JPEGs in photos_april/ to max 2000px on the long side.
Output goes to photos_april_web/ with quality=88.
"""
import os
from pathlib import Path
from PIL import Image

SRC = Path(__file__).parent / "photos_april"
DST = Path(__file__).parent / "photos_april_web"
MAX_PX = 2000

DST.mkdir(exist_ok=True)

files = sorted(f for f in SRC.iterdir() if f.suffix.lower() in ('.jpg', '.jpeg', '.png'))
print(f"Found {len(files)} images in {SRC}")

for src_path in files:
    dst_path = DST / src_path.name
    with Image.open(src_path) as img:
        w, h = img.size
        long_side = max(w, h)
        if long_side > MAX_PX:
            scale = MAX_PX / long_side
            new_w, new_h = int(w * scale), int(h * scale)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            print(f"  {src_path.name}: {w}x{h} -> {new_w}x{new_h}")
        else:
            print(f"  {src_path.name}: {w}x{h} (no resize needed)")
        # Preserve EXIF if available
        exif = img.info.get('exif', b'')
        save_kwargs = {'quality': 88, 'optimize': True}
        if exif:
            save_kwargs['exif'] = exif
        img.save(dst_path, **save_kwargs)

print(f"\nDone! Resized images saved to {DST}")
