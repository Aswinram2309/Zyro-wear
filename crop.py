import sys
sys.path.insert(0, r"c:\Users\Asus\OneDrive\Documents\assets\python-embed\Lib\site-packages")
import os
from PIL import Image

src_dir = r"c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Reviews"
out_dir = r"c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Reviews_Cleaned"
os.makedirs(out_dir, exist_ok=True)

files = [f for f in os.listdir(src_dir) if f.lower().endswith(('.jpeg', '.jpg', '.png'))]
for filename in files:
    img_path = os.path.join(src_dir, filename)
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    
    # Top 14% crop removes contact header (phone number/profile)
    # Bottom 10% crop removes message input box
    cropped = img.crop((0, int(h * 0.14), w, int(h * 0.90)))
    cropped.save(os.path.join(out_dir, filename), "JPEG", quality=95)

print("SUCCESSFULLY_CROPPED_REVIEWS")
