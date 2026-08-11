import sys
import os

# Add site-packages to sys.path for embedded python
site_packages = r"c:\Users\Asus\OneDrive\Documents\assets\python-embed\Lib\site-packages"
if site_packages not in sys.path:
    sys.path.insert(0, site_packages)

from PIL import Image

src_dir = r"c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Reviews"
out_dir = r"c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Cleaned_Reviews"
os.makedirs(out_dir, exist_ok=True)

files = [f for f in os.listdir(src_dir) if f.lower().endswith(('.jpeg', '.jpg', '.png'))]

for filename in files:
    img_path = os.path.join(src_dir, filename)
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    
    # WhatsApp top header (phone number & profile) takes top 14%
    # Bottom message bar takes bottom 10%
    top_crop = int(h * 0.14)
    bottom_crop = int(h * 0.90)
    
    cropped = img.crop((0, top_crop, w, bottom_crop))
    out_path = os.path.join(out_dir, filename)
    cropped.save(out_path, "JPEG", quality=95)
    print(f"CLEANED REVIEW: {filename}")

print(f"SUCCESSFULLY_CLEANED_{len(files)}_REVIEWS")
