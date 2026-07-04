from PIL import Image

# Load the cropped logo
img = Image.open('/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/logo.png')
width, height = img.size

# The logo is "REVIVE SPORTS" with the R shield on the left.
# The shield is essentially the leftmost part. Let's find the first transparent gap after the shield.
pixels = img.load()

# Scan column by column to find the first fully transparent column after the initial non-transparent pixels
in_shield = False
gap_start_x = width

for x in range(width):
    # Check if column x has any opaque pixels
    column_opaque = False
    for y in range(height):
        # get pixel alpha
        pixel = pixels[x, y]
        if len(pixel) == 4 and pixel[3] > 0:
            column_opaque = True
            break
            
    if column_opaque:
        in_shield = True
    elif in_shield:
        # We found a gap after the shield!
        # wait, the shield might have small vertical gaps? No, the 'R' is continuous vertically.
        # But just in case, let's say the gap must be at least a few pixels wide.
        gap_start_x = x
        break

if gap_start_x < width:
    # Crop just the shield
    shield = img.crop((0, 0, gap_start_x, height))
    
    # We want it to be a perfect square for the circle
    # Let's paste it into a square transparent image
    max_dim = max(shield.width, shield.height)
    square = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    offset = ((max_dim - shield.width) // 2, (max_dim - shield.height) // 2)
    square.paste(shield, offset)
    
    square.save('/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/escudo.png')
    print("Shield perfectly extracted: {}x{}".format(shield.width, shield.height))
else:
    print("Could not find a gap, just cropping a square from left")
    shield = img.crop((0, 0, height, height))
    shield.save('/Users/ynavarrete8181/Documents/Desarrollo/Revive/train-gym-web/src/assets/imagenes/escudo.png')
