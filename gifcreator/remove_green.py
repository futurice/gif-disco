"""
Removes greenscreen from an image.
Usage: python greenscreen_remove.py image.jpg
"""

from PIL import Image
import sys
import os
import colorsys


GREEN_RANGE_MIN_HSV = (100, 80, 70)
GREEN_RANGE_MAX_HSV = (185, 255, 255)


def rgb_to_hsv(r, g ,b):
    """Convert R(0-255) G(0-255) B(0-255) to H(0-360) S(0-255) V(0-255).
    """
    rgb = [x / 255.0 for x in (r, g, b)]
    h, s, v = colorsys.rgb_to_hsv(*rgb)
    return (h * 360, s * 255, v * 255)

def main():
    # Load image and convert it to RGBA, so it contains alpha channel
    file_path = sys.argv[1]
    name, ext = os.path.splitext(file_path)
    im = Image.open(file_path)
    im = im.convert('RGBA')

    # Go through all pixels and turn each 'green' pixel to transparent
    pix = im.load()
    width, height = im.size
    for x in range(width):
        for y in range(height):
            r, g, b, a = pix[x, y]
            h, s, v = rgb_to_hsv(r, g, b)

            min_h, min_s, min_v = GREEN_RANGE_MIN_HSV
            max_h, max_s, max_v = GREEN_RANGE_MAX_HSV
            if min_h <= h <= max_h and min_s <= s <= max_s and min_v <= v <= max_v:
                pix[x, y] = (0, 0, 0, 0)

    im.save(name + '.png')


if __name__ == '__main__':
    main()
