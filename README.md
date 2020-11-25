Tesseract OCR Lambda Layer
===

### :sparkles: see also my [new repo](https://github.com/bweigel/aws-lambda-layers) for layer deployment via the AWS cloud development kit (CDK) :sparkles:

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

## Build &  Deploy layer

```shell
# Build Layer components
./build.sh
# Deploy via Serverless
sls deploy
```

## How to use

There is an [example](./example) included for how to use this with the [Serverless Framework](https://serverless.com/). Follow instructions below.

## Avoiding Pillow library issues
Use [cloud9 IDE](https://aws.amazon.com/cloud9/) with AMI linux to deploy [example](./example). Or alternately follow instructions for getting correct binaries for lambda using [EC2](https://forums.aws.amazon.com/thread.jspa?messageID=915630). AWS lambda uses AMI linux distro which needs correct python binaries. This step is not needed for deploying layer function. Layer function and example function are separately deployed.

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

## Known Issues

### Unable to import module 'handler': cannot import name '_imaging'

You might run into an issue like this:

```
/var/task/PIL/_imaging.cpython-36m-x86_64-linux-gnu.so: ELF load command address/offset not properly aligned  
Unable to import module 'handler': cannot import name '_imaging'
```

The root cause is a faulty stripping of libraries using [`strip`](https://man7.org/linux/man-pages/man1/strip.1.html) [here](https://github.com/bweigel/aws-lambda-tesseract-layer/blob/42b725f653520b2b4d7081998ef8dca6b9b9d7df/Dockerfile#L46). 

**Quickfix**
> You can just disable stripping (comment out the line in the `Dockerfile`) and the libraries (`*.so`) won't be stripped. This also means the library files will be larger and your artifact might exceed lambda limits.

**A lenghtier fix**

AWS Lambda Runtimes work on top of Amazon Linux. Depending on the Runtime AWS Lambda uses Amazon Linux Version 1 or Version 2 under the hood. 
For example the Python 3.8 Runtime uses Amazon Linux 2, whereas Python <= 3.7 uses version 1.

The current Dockerfile runs on top of Amazon Linux Version 1. So artifacts for runtimes running version 2 will throw the above error. 
You can try and use a base Dockerimage for Amazon Linux 2 in these cases:

```Dockerfile
FROM: lambci/lambda-base-2:build
...
```

or, as @secretshardul suggested

>simple solution: Use AWS cloud9 to deploy example folder. Layer can be deployed from anywhere.
>complex solution: Deploy EC2 instance with AMI linux and get correct binaries.

## Contributors :heart:

- @secretshardul 
