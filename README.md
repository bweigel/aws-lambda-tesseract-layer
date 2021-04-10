Tesseract OCR Lambda Layer
===

![Tesseract](https://img.shields.io/badge/Tesseract-5.0.0--alpha--20201231-green?style=flat-square)
![Leptonica](https://img.shields.io/badge/Leptonica-1.80.0-green?style=flat-square)

![Examples available for Runtimes](https://img.shields.io/badge/Examples_(Lambda_runtimes)-Python_3.8(AL2)-informational?style=flat-square)
![Examples available for IaC Tools](https://img.shields.io/badge/Examples_(IaC)-Serverless_Framework,_AWS_CDK-informational?style=flat-square)


![Continuos Integration](https://github.com/bweigel/aws-lambda-tesseract-layer/workflows/Continuos%20Integration/badge.svg)

> AWS Lambda layer containing the [tesseract OCR](https://github.com/tesseract-ocr/tesseract) libraries and command-line binary for Lambda Runtimes running on Amazon Linux 1 and 2.

<!-- TOC -->

- [Quickstart](#quickstart)
- [Ready-to-use binaries](#ready-to-use-binaries)
    - [Use with Serverless Framework](#use-with-serverless-framework)
    - [Use with AWS CDK](#use-with-aws-cdk)
- [Build tesseract layer from source using Docker](#build-tesseract-layer-from-source-using-docker)
    - [available `Dockerfile`s](#available-dockerfiles)
    - [Building a different tesseract version and/or language](#building-a-different-tesseract-version-andor-language)
    - [Deployment size optimization](#deployment-size-optimization)
    - [Building directly using CDK](#building-directly-using-cdk)
    - [Layer contents](#layer-contents)
- [Known Issues](#known-issues)
    - [Avoiding Pillow library issues](#avoiding-pillow-library-issues)
    - [Unable to import module 'handler': cannot import name '_imaging'](#unable-to-import-module-handler-cannot-import-name-_imaging)
- [Contributors :heart:](#contributors-heart)

<!-- /TOC -->

# Quickstart

This repo comes with ready-to-use binaries compiled against the AWS Lambda Runtimes (based on Amazon Linux 2).
Example Projects in Python 3.8 using Serverless Framework and CDK are provided:

```bash
## Demo using Serverless Framework and prebuilt layer
cd example/serverless
npm ci
npx sls deploy

## or ..

## Demo using CDK and prebuilt layer
cd example/cdk
npm ci
npx cdk deploy
```
# Ready-to-use binaries

For ready to use binaries that you can put in your layer see [`ready-to-use`](./ready-to-use).

See [examples](./example) for some ready-to-use examples.

## Use with Serverless Framework

> [Serverless Framework](https://www.serverless.com/framework/docs/getting-started/)

Reference the path to the ready-to-use layer contents in your `serverless.yml`:

```yaml
service: tesseract-ocr-layer

provider:
  name: aws

# define layer
layers:
  tesseractAl2:
    # and path to contents
    path: ready-to-use/amazonlinux-2
    compatibleRuntimes:
      - python3.8

functions:
  tesseract-ocr:
    handler: ...
    runtime: python3.8
    # reference layer in function
    layers:
      - { Ref: TesseractAl2LambdaLayer }
    events:
      - http:
          path: ocr
          method: post
```

Deploy

```
npx sls deploy
```

## Use with AWS CDK

> [AWS CDK](https://github.com/aws/aws-cdk#getting-started)

Reference the path to the layer contents in your constructs:

```typescript
const app = new App();
const stack = new Stack(app, 'tesseract-lambda-ci');

const al2Layer = new lambda.LayerVersion(stack, 'al2-layer', {
    // reference the directory containing the ready-to-use layer
    code: Code.fromAsset(path.resolve(__dirname, './ready-to-use/amazonlinux-2')),
    description: 'AL1 Tesseract Layer',
});
new lambda.Function(stack, 'python38', {
    // reference the source code to your function
    code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers')),
    runtime: Runtime.PYTHON_3_8,
    // add tesseract layer to function
    layers: [al2Layer],
    memorySize: 512,
    timeout: Duration.seconds(30),
    handler: 'handler.main',
});
```

# Build tesseract layer from source using Docker

You can build layer contents manually with the [provided `Dockerfile`s](#available-dockerfiles).

Build layer using your preferred `Dockerfile`:

```bash
## build
docker build -t tesseract-lambda-layer -f [Dockerfile] .
## run container
export CONTAINER=$(docker run -d tesseract-lambda-layer false)
## copy tesseract files from container to local folder layer
docker cp $CONTAINER:/opt/build-dist layer
## remove Docker container
docker rm $CONTAINER
unset CONTAINER
```

## available `Dockerfile`s

| Dockerfile       | Base-Image     | compatible Runtimes                                                   |
|:-----------------|:---------------|:----------------------------------------------------------------------|
| `Dockerfile` | Amazon Linux 2 | Python 3.8, Ruby 2.7, Java 8/11 (Coretto), .NET Core 3.1              |


## Building a different tesseract version and/or language

Per default the build generated the [tesseract 5.0.0-alpha-20210401](https://github.com/tesseract-ocr/tesseract/releases/tag/5.0.0-alpha-20201231) OCR libraries with the _fast_ german, english and osd (orientation and script detection) [data files](https://github.com/tesseract-ocr/tesseract/wiki/Data-Files) included.

The build process can be modified using different build time arguments (defined as `ARG` in `Dockerfile`), using the `--build-arg` option of `docker build`.

| Build-Argument           | description                                                                                                       | available versions                                                                                                                        |
|:-------------------------|:------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------|
| `TESSERACT_VERSION`      | the tesseract OCR engine                                                                                          | https://github.com/tesseract-ocr/tesseract/releases                                                                                       |
| `LEPTONICA_VERSION`      | fundamental image processing and analysis library                                                                 | https://github.com/danbloomberg/leptonica/releases                                                                                        |
| `OCR_LANG`               | Language to install (in addition to `eng` and `osd`)                                                              | https://github.com/tesseract-ocr/tessdata (`<lang>.traineddata`)                                                                          |
| `TESSERACT_DATA_SUFFIX`  | Trained LSTM models for tesseract. Can be empty (default), `_best` (best inference) and `_fast` (fast inference). | https://github.com/tesseract-ocr/tessdata, https://github.com/tesseract-ocr/tessdata_best, https://github.com/tesseract-ocr/tessdata_fast |
| `TESSERACT_DATA_VERSION` | Version of the trained LSTM models for tesseract. (currently - in January 2021 - only `4.0.0` is available)       | https://github.com/tesseract-ocr/tessdata/releases/tag/4.0.0                                                                              |


**Example of custom build**

```bash
## Build a Dockerimage with Tesseract 4.0.0
docker build --build-arg TESSERACT_VERSION=4.0.0 -t tesseract-lambda-layer -f Dockerfile .
```

## Deployment size optimization

The library files that are content of the layer are stripped, before deployment to make them more suitable for the lambda environment. See `Dockerfile`s:

```Dockerfile
RUN ... \
  find ${DIST}/lib -name '*.so*' | xargs strip -s
```

The stripping can cause issues, when the build runtime and the lambda runtime are different (e.g. if building on Amazon Linux 1 and running on Amazon Linux 2).

## Building directly using CDK

You can build the layer directly, when using AWS CDK, using the [`bundling` option](https://aws.amazon.com/blogs/devops/building-apps-with-aws-cdk/).
See [`continous-integration/index.ts`](continous-integration/index.ts) and the [corresponding Github Workflow](https://github.com/bweigel/aws-lambda-tesseract-layer/actions?query=workflow%3A%22Continuos+Integration%22) for an example.

## Layer contents

The layer contents get deployed to `/opt`, when used by a function. See [here](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) for details.
See [ready-to-use](./ready-to-use/) for layer contents for Amazon Linux 2.

# Known Issues
## Avoiding Pillow library issues
Use [cloud9 IDE](https://aws.amazon.com/cloud9/) with AMI linux to deploy [example](./example). Or alternately follow instructions for getting correct binaries for lambda using [EC2](https://forums.aws.amazon.com/thread.jspa?messageID=915630). AWS lambda uses AMI linux distro which needs correct python binaries. This step is not needed for deploying layer function. Layer function and example function are separately deployed.

## Unable to import module 'handler': cannot import name '_imaging'

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

# Contributors :heart:

- @secretshardul
- @TheLucasMoore for providing a Dockerfile that builds working binaries for Python 3.8 / Amazon Linux 2
