import os
import sys
from PIL import Image

log_file = r"c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\review_clean.log"
with open(log_file, "w") as f:
    f.write("Review cleaning started\n")

try:
    src_dir = r"c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Reviews"
    out_dir = r"c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Cleaned_Reviews"
    os.makedirs(out_dir, exist_ok=True)

    files = [f for f in os.listdir(src_dir) if f.lower().endswith(('.jpeg', '.jpg', '.png'))]

    processed_count = 0
    for filename in files:
        img_path = os.path.join(src_dir, filename)
        img = Image.open(img_path).convert("RGB")
        width, height = img.size

        top_crop = int(height * 0.14)
        bottom_crop = int(height * 0.90)

        cropped_img = img.crop((0, top_crop, width, bottom_crop))
        out_path = os.path.join(out_dir, filename)
        cropped_img.save(out_path, "JPEG")
        
        with open(log_file, "a") as f:
            f.write(f"Cleaned: {filename}\n")
        processed_count += 1

    with open(log_file, "a") as f:
        f.write(f"SUCCESS: {processed_count} files cleaned\n")

except Exception as e:
    with open(log_file, "a") as f:
        f.write(f"ERROR: {str(e)}\n")
