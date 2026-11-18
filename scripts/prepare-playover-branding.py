"""Prepare the supplied, approved raster artwork. Requires the local Pillow tool.

Usage: python3 scripts/prepare-playover-branding.py /path/to/playover-home-approved
No lettering or interior artwork is regenerated.
"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw

source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
output = root / 'public' / 'branding'
output.mkdir(parents=True, exist_ok=True)

# The portable derivative has disconnected white fragments outside its frame.
# Trim to the frame and mask only that outside fringe at source resolution.
window = Image.open(source / 'playover-window-portable-preview.png').convert('RGBA')
window = window.crop((238, 150, 1018, 1064))
mask = Image.new('L', window.size)
ImageDraw.Draw(mask).rounded_rectangle((1, 1, 778, 912), radius=310, fill=255)
window.putalpha(mask)
window.resize((216, 264), Image.Resampling.LANCZOS).save(output / 'window.png', optimize=True)

# Match the reference's centered 124% alpha mask within a 196x66 box.
wordmark = Image.open(source / 'playover-wordmark-capital-p-preview.png').convert('RGBA')
alpha = wordmark.getchannel('A')
light = Image.new('RGBA', wordmark.size, '#f0f2f4')
light.putalpha(alpha)
light = light.resize((round(196 * 1.24 * 4), round(196 * 1.24 / 3 * 4)), Image.Resampling.LANCZOS)
canvas = Image.new('RGBA', (784, 264))
canvas.alpha_composite(light, ((784 - light.width) // 2, (264 - light.height) // 2))
canvas.save(output / 'wordmark.png', optimize=True)

# iOS supplies its own rounded corners. Keep the approved navy backing full bleed.
for size in (180, 192, 512):
    icon = Image.new('RGBA', (size, size), '#0b2345')
    mark = window.resize((round(size * .73), round(size * .82)), Image.Resampling.LANCZOS)
    icon.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    icon.convert('RGB').save(root / 'public' / f'icon-{size}.png', optimize=True)
