from pathlib import Path
from PIL import Image
import pytesseract

def main(evt, ctx):
    img = Image.open(Path('faust.png'))
    txt = pytesseract.image_to_string(img, lang="deu")
    return txt

