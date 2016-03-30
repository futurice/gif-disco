"""
Removes whitescreen from an image.
Usage: python whitescreen_remove.py image.jpg
"""

from PIL import Image
import sys
import os
import colorsys


WHITE_RANGE_MIN_HLS = (0, 140, 0)
WHITE_RANGE_MAX_HLS = (360, 255, 255)


def rgb_to_hls(r, g ,b):
    """Convert R(0-255) G(0-255) B(0-255) to H(0-360) L(0-255) S(0-255).
    """
    rgb = [x / 255.0 for x in (r, g, b)]
    h, s, v = colorsys.rgb_to_hls(*rgb)
    return (h * 360, s * 255, v * 255)


def main():
    # Load image and convert it to RGBA, so it contains alpha channel
    file_path = sys.argv[1]
    name, ext = os.path.splitext(file_path)
    im = Image.open(file_path)
    im = im.convert('RGBA')

    # Go through all pixels and turn each 'white' pixel to transparent
    pix = im.load()
    width, height = im.size
    for x in range(width):
        for y in range(height):
            r, g, b, a = pix[x, y]
            h, l, s = rgb_to_hls(r, g, b)

            min_h, min_l, min_s = WHITE_RANGE_MIN_HLS
            max_h, max_l, max_s = WHITE_RANGE_MAX_HLS
            if min_h <= h <= max_h and min_l <= l <= max_l and min_s <= s <= max_s:
                pix[x, y] = (0, 0, 0, 0)

    im.save(name + '.png')


if __name__ == '__main__':
    main()