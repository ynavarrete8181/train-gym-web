from PIL import Image
import os

png_path = '/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/logo.png'
output_png = '/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/logo.png'
output_escudo = '/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/escudo.png'

# Open the previously generated transparent PNG
img = Image.open(png_path).convert("RGBA")

# Get bounding box of non-transparent pixels
bbox = img.getbbox()

if bbox:
    # Crop to bounding box (removes all transparent padding)
    img_cropped = img.crop(bbox)
    img_cropped.save(output_png, "PNG")
    
    # Now that the padding is gone, the shield is strictly on the left.
    # The shield "R" takes up roughly the first 25% of the cropped logo.
    # Let's crop it tightly for escudo.png
    width, height = img_cropped.size
    
    # We will take a square crop from the left side
    box_escudo = (0, 0, height, height)
    escudo_img = img_cropped.crop(box_escudo)
    escudo_img.save(output_escudo, "PNG")
    print("Images cropped successfully!")
else:
    print("Image is entirely transparent or couldn't find bounding box.")
