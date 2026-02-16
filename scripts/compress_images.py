from PIL import Image
import os

def compress_image(file_path, quality=85):
    try:
        img = Image.open(file_path)
        original_size = os.path.getsize(file_path)
        
        # If it has alpha and we are saving as JPEG, we need to convert
        if img.mode in ("RGBA", "P") and file_path.endswith('.jpeg'):
            img = img.convert("RGB")
            
        img.save(file_path, optimize=True, quality=quality)
        new_size = os.path.getsize(file_path)
        print(f"Compressed {file_path}: {original_size/1024:.2f}KB -> {new_size/1024:.2f}KB ({(1 - new_size/original_size)*100:.2f}% reduction)")
    except Exception as e:
        print(f"Error compressing {file_path}: {e}")

images = [
    r"public\favicon.png",
    r"public\logo-futgestor.png",
    r"src\assets\foto-time.jpeg"
]

for img_path in images:
    if os.path.exists(img_path):
        compress_image(img_path)
    else:
        print(f"File not found: {img_path}")
