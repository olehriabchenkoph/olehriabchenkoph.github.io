import os
import json
import sys
from PIL import Image

# Ensure unicode characters can be printed
sys.stdout.reconfigure(encoding='utf-8')

def resize_image(image_path, max_width=600):
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            if width > max_width:
                new_height = int((max_width / width) * height)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                img.save(image_path, optimize=True, quality=80)
                print(f"Resized: {image_path} -> {max_width}x{new_height}")
            # Even if not resized, maybe optimize size?
            # else: img.save(image_path, optimize=True, quality=80) # Optional, strictly requested "if needed to compress"
    except Exception as e:
        print(f"Error resizing {image_path}: {e}")

def scan_images(directory):
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    image_paths = []

    for root, _, files in os.walk(directory):
        for file in files:
            if os.path.splitext(file)[1].lower() in image_extensions:
                full_path = os.path.join(root, file)
                
                # Resize for performance
                resize_image(full_path)
                
                # Get relative path and replace backslashes with forward slashes for web compatibility
                rel_path = os.path.relpath(full_path, ".")
                image_paths.append(rel_path.replace("\\", "/"))

    return image_paths

def generate_js_file(image_paths, output_file="image_data.js"):
    js_content = f"const allImages = {json.dumps(image_paths, indent=4)};"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"Successfully generated {output_file} with {len(image_paths)} images.")

if __name__ == "__main__":
    images_dir = "images"
    if os.path.exists(images_dir):
        paths = scan_images(images_dir)
        generate_js_file(paths)
    else:
        print(f"Directory '{images_dir}' not found.")
