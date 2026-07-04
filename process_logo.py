from PIL import Image
import os

input_path = '/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/logo.jpeg'
output_png = '/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/logo.png'
output_escudo = '/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/escudo.png'

# 1. Make transparent full logo
img = Image.open(input_path).convert("RGBA")
datas = img.getdata()
newData = []
for item in datas:
    # If the pixel is dark, make it transparent
    if item[0] < 30 and item[1] < 30 and item[2] < 30:
        newData.append((255, 255, 255, 0))
    else:
        # Boost brightness slightly to compensate for JPEG artifacts
        newData.append((min(255, int(item[0]*1.1)), min(255, int(item[1]*1.1)), min(255, int(item[2]*1.1)), 255))
img.putdata(newData)
img.save(output_png, "PNG")

# 2. Crop the shield (assuming the shield is on the left side of the image)
# We'll just take the left 35% of the image
width, height = img.size
# Crop box: (left, upper, right, lower)
# The image is 500x500 (example). We want the left part.
box = (0, 0, int(width * 0.4), height)
escudo_img = img.crop(box)
escudo_img.save(output_escudo, "PNG")

print("Images generated!")
