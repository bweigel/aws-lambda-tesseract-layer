from PIL import Image
import requests
import pytesseract
from io import BytesIO


def main(evt, ctx):
    url = evt["body"]
    res = requests.get(url)
    img = Image.open(BytesIO(res.content))
    txt = pytesseract.image_to_string(img, lang="deu")
    return {"statusCode": 200, "body": txt}

