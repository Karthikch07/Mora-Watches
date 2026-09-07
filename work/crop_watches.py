from pathlib import Path
from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "watch-collection.png"
OUT_DIR = ROOT / "public" / "watches"
PREVIEW = ROOT / "work" / "watch-crops-preview.png"

WATCHES = [
    ("atlas-chrono", (225, 42, 620, 482)),
    ("nocturne-dress", (600, 42, 965, 482)),
    ("auric-automatic", (900, 50, 1308, 486)),
    ("field-green", (205, 486, 612, 966)),
    ("ceramic-diver", (568, 482, 954, 966)),
    ("rose-mesh", (928, 492, 1324, 970)),
]


def make_tile(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    crop = source.crop(box).convert("RGB")
    size = (1000, 1000)

    background = ImageOps.fit(
        crop,
        size,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    ).filter(ImageFilter.GaussianBlur(22))

    veil = Image.new("RGB", size, (244, 242, 235))
    background = Image.blend(background, veil, 0.34)

    foreground = ImageOps.contain(
        crop,
        (900, 900),
        method=Image.Resampling.LANCZOS,
    )
    x = (size[0] - foreground.width) // 2
    y = (size[1] - foreground.height) // 2
    background.paste(foreground, (x, y))
    return background


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE)
    tiles = []

    for name, box in WATCHES:
      tile = make_tile(source, box)
      tile.save(OUT_DIR / f"{name}.png", optimize=True)
      tiles.append(tile.resize((300, 300), Image.Resampling.LANCZOS))

    preview = Image.new("RGB", (900, 600), (247, 248, 243))
    for index, tile in enumerate(tiles):
      x = (index % 3) * 300
      y = (index // 3) * 300
      preview.paste(tile, (x, y))
    preview.save(PREVIEW, optimize=True)


if __name__ == "__main__":
    main()
