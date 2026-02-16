import os
from PIL import Image  # Импортируем библиотеку для работы с изображениями

# --- НАСТРОЙКИ ---
# Добавьте сюда свои 6 новых проектов по аналогии
SERIES_CONFIG = [
    {
        "title": "Archive 2025",
        "folder": "images/archive2025",
        "output_filename": "archive-2025.html"
    },
    {
        "title": "Archive 2024",
        "folder": "images/archive2024",
        "output_filename": "archive-2024.html"
    },
    {
        "title": "Gaze",
        "folder": "images/gaze",
        "output_filename": "gaze.html"
    },
    {
        "title": "GIEDI SNOW",
        "folder": "images/dune",
        "output_filename": "GIEDI_SNOW.html"
    },
    {
        "title": "Color",
        "folder": "images/color",
        "output_filename": "Color.html"
    },
    {
        "title": "Scan",
        "folder": "images/scan",
        "output_filename": "Scan.html"
    },
    {
        "title": "I",
        "folder": "images/i_am",
        "output_filename": "I.html"
    },
    {
        "title": "City geometry",
        "folder": "images/city_geometry",
        "output_filename": "city_geometry.html"
    },
    # Пример нового проекта:
    # {
    #     "title": "Project Title 1",
    #     "folder": "images/project1",
    #     "output_filename": "project-1.html"
    # },
]

MAX_WIDTH = 1920  # Максимальная ширина фото. Если больше - уменьшаем.

# Шапка сайта
HTML_HEADER = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <a href="index.html" class="logo">Oleh Riabchenko</a>
        <nav>
            <a href="index.html">&larr; Back to Works</a>
        </nav>
    </header>
    
    <main class="single-series-layout">
        <div class="series-header">
            <h1>{title}</h1>
        </div>
        
        <div class="gallery-grid">
"""

# Подвал с встроенным скриптом для Lightbox
HTML_FOOTER = """        </div>
    </main>

    <div id="lightbox">
        <div class="lb-close" onclick="closeLightbox()">&times;</div>
        <div class="lb-nav lb-prev" onclick="changeImage(-1)"></div>
        <div class="lb-nav lb-next" onclick="changeImage(1)"></div>
        <img id="lb-image" src="" alt="">
    </div>

    <script>
        const lightbox = document.getElementById('lightbox');
        const lbImage = document.getElementById('lb-image');
        let images = [];
        let currentIndex = 0;

        document.addEventListener('DOMContentLoaded', () => {
            const items = document.querySelectorAll('.photo-item img');
            items.forEach((img, index) => {
                images.push(img.src);
                img.parentElement.onclick = () => openLightbox(index);
            });
        });

        function openLightbox(index) {
            currentIndex = index;
            lbImage.src = images[currentIndex];
            lightbox.classList.add('active');
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
        }

        function changeImage(direction) {
            event.stopPropagation();
            currentIndex += direction;
            if (currentIndex >= images.length) currentIndex = 0;
            if (currentIndex < 0) currentIndex = images.length - 1;
            
            lbImage.style.opacity = 0.5;
            setTimeout(() => {
                lbImage.src = images[currentIndex];
                lbImage.style.opacity = 1;
            }, 150);
        }

        lightbox.onclick = (e) => {
            if (e.target === lightbox) closeLightbox();
        };

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') changeImage(1);
            if (e.key === 'ArrowLeft') changeImage(-1);
        });
    </script>
</body>
</html>
"""

def resize_image(image_path):
    """Проверяет и уменьшает изображение, если оно слишком большое."""
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            if width > MAX_WIDTH:
                # Вычисляем новую высоту, сохраняя пропорции
                new_height = int((MAX_WIDTH / width) * height)
                img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
                # Сохраняем поверх старого файла с оптимизацией
                img.save(image_path, optimize=True, quality=85)
                print(f"  [Resized] {image_path} -> {MAX_WIDTH}x{new_height}")
            else:
               print(f"  [OK] {image_path} is small enough.")
    except Exception as e:
        print(f"  [Error] Could not process {image_path}: {e}")


def generate_pages():
    for config in SERIES_CONFIG:
        folder = config['folder']
        title = config['title']
        output_file = config['output_filename']
        
        if not os.path.exists(folder):
            print(f"[Warning] Папка {folder} не найдена. Пропускаю.")
            continue

        images = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        images.sort()

        print(f"Обработка '{title}': найдено {len(images)} фото.")

        images_html = ""
        for img_name in images:
            img_path = f"{folder}/{img_name}"
            
            # --- НОВЫЙ ШАГ: Уменьшаем фото ---
            resize_image(img_path)
            # ---------------------------------

            images_html += f"""
            <div class="photo-item">
                <img src="{img_path}" loading="lazy" alt="{img_name}">
            </div>"""

        full_html = HTML_HEADER.format(title=title) + images_html + HTML_FOOTER

        with open(output_file, "w", encoding="utf-8") as f:
            f.write(full_html)
            
        print(f"Готово! Файл {output_file} создан.\n")

if __name__ == "__main__":
    generate_pages()