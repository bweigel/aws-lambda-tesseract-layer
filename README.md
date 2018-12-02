Tesseract OCR Lambda Layer
===

This projects creates an AWS lambda layer that contains the [tesseract 4.0.0](https://github.com/tesseract-ocr/tesseract) OCR libraries.
The _fast_ german, english and osd (orientation and script detection) [data files](https://github.com/tesseract-ocr/tesseract/wiki/Data-Files) are included by default, but can be changed by editing the `Dockerfile`:

```Dockerfile
...
ARG DIST=/opt/build-dist
# change OCR_LANG to enable the layer for different languages
ARG OCR_LANG=deu
# change TESSERACT_SUFFIX to use different datafiles (options: "_best", "_fast" and "")
ARG TESSERACT_SUFFIX=_fast
...
```

The library files that are content of the layer are stripped, before deployment to make them more suitable for the lambda environment.

## Deploy layer

```bash
sls deploy
```
## How to use

There is an [example](./example) included for how to use this with the [Serverless Framework](https://serverless.com/).

## Misc: Layer contents

The layer contents get deployed to `/opt`, when used by a function. See [here](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) for details:


```bash
$ ls -laR layer
layer:
total 24
drwxr-xr-x 5 bweigel bweigel 4096 Dez  2 22:42 .
drwxrwxr-x 8 bweigel bweigel 4096 Dez  2 23:24 ..
drwxr-xr-x 2 bweigel bweigel 4096 Dez  2 22:42 bin
drwxr-xr-x 2 bweigel bweigel 4096 Dez  2 22:42 lib
-rw-rw-r-- 1 bweigel bweigel   42 Dez  2 22:42 .slsignore
drwxr-xr-x 3 bweigel bweigel 4096 Dez  2 22:42 tesseract

layer/bin:
total 320
drwxr-xr-x 2 bweigel bweigel   4096 Dez  2 22:42 .
drwxr-xr-x 5 bweigel bweigel   4096 Dez  2 22:42 ..
-rwxr-xr-x 1 bweigel bweigel 316127 Dez  2 22:42 tesseract

layer/lib:
total 6072
drwxr-xr-x 2 bweigel bweigel    4096 Dez  2 22:42 .
drwxr-xr-x 5 bweigel bweigel    4096 Dez  2 22:42 ..
-rwxr-xr-x 1 bweigel bweigel 2534424 Dez  2 22:42 liblept.so.5
-rwxr-xr-x 1 bweigel bweigel 3354640 Dez  2 22:42 libtesseract.so.4
-rwxr-xr-x 1 bweigel bweigel  311352 Dez  2 22:42 libwebp.so.4

layer/tesseract:
total 12
drwxr-xr-x 3 bweigel bweigel 4096 Dez  2 22:42 .
drwxr-xr-x 5 bweigel bweigel 4096 Dez  2 22:42 ..
drwxr-xr-x 3 bweigel bweigel 4096 Dez  2 22:42 share

layer/tesseract/share:
total 12
drwxr-xr-x 3 bweigel bweigel 4096 Dez  2 22:42 .
drwxr-xr-x 3 bweigel bweigel 4096 Dez  2 22:42 ..
drwxr-xr-x 2 bweigel bweigel 4096 Dez  2 22:42 tessdata

layer/tesseract/share/tessdata:
total 15836
drwxr-xr-x 2 bweigel bweigel     4096 Dez  2 22:42 .
drwxr-xr-x 3 bweigel bweigel     4096 Dez  2 22:42 ..
-rw-r--r-- 1 bweigel bweigel  1525436 Dez  2 22:42 deu.traineddata
-rw-r--r-- 1 bweigel bweigel  4113088 Dez  2 22:42 eng.traineddata
-rw-r--r-- 1 bweigel bweigel 10562727 Dez  2 22:42 osd.traineddata
```
