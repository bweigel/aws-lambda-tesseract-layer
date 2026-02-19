Tesseract OCR Lambda Layer
===

![Tesseract](https://img.shields.io/badge/Tesseract-5.5.2-green?style=flat-square)
![Leptonica](https://img.shields.io/badge/Leptonica-1.87.0-green?style=flat-square)

![Examples available for Runtimes](https://img.shields.io/badge/Examples_(Lambda_runtimes)-Python_3.12(AL2023),Node.js_20(AL2023)-informational?style=flat-square)
![Examples available for IaC Tools](https://img.shields.io/badge/Examples_(IaC)-Serverless_Framework,_AWS_CDK-informational?style=flat-square)


![Continuos Integration](https://github.com/bweigel/aws-lambda-tesseract-layer/workflows/Continuos%20Integration/badge.svg)

> AWS Lambda layer containing the [tesseract OCR](https://github.com/tesseract-ocr/tesseract) libraries and command-line binary for Lambda Runtimes running on Amazon Linux 2023 and 2.

> :warning: **DEPRECATION NOTICE**:
> - **Amazon Linux 1 (AL1)**: Removed. No longer supported.
> - **Amazon Linux 2 (AL2)**: **Deprecated**. Will be removed after 6 months. New projects should use Amazon Linux 2023 (AL2023).
> - **Recommended**: Use Amazon Linux 2023 (AL2023) for all new projects.

<!-- TOC -->

- [Quickstart](#quickstart)
- [Ready-to-use binaries](#ready-to-use-binaries)
    - [Use with Serverless Framework](#use-with-serverless-framework)
    - [Use with AWS CDK](#use-with-aws-cdk)
- [Build tesseract layer from source using Docker](#build-tesseract-layer-from-source-using-docker)
    - [available `Dockerfile`s](#available-dockerfiles)
    - [Building a different tesseract version and/or language](#building-a-different-tesseract-version-andor-language)
    - [Deployment size optimization](#deployment-size-optimization)
    - [Building the layer binaries directly using CDK](#building-the-layer-binaries-directly-using-cdk)
    - [Layer contents](#layer-contents)
- [Migration from AL2 to AL2023](#migration-from-al2-to-al2023)
    - [Why Migrate?](#why-migrate)
    - [Migration Steps](#migration-steps)
    - [Common Issues](#common-issues)
- [Known Issues](#known-issues)
    - [Avoiding Pillow library issues](#avoiding-pillow-library-issues)
    - [Unable to import module 'handler': cannot import name '_imaging'](#unable-to-import-module-handler-cannot-import-name-_imaging)
- [Contributors :heart:](#contributors-heart)

<!-- /TOC -->

# Quickstart

This repo comes with ready-to-use binaries compiled against the AWS Lambda Runtimes (based on Amazon Linux 2023 and 2).
Example Projects in Python 3.12 and Node.js 20 using Serverless Framework and CDK are provided:

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

For compiled, ready to use binaries that you can put in your layer see [`ready-to-use`](./ready-to-use), or check out the [latest release](https://github.com/bweigel/aws-lambda-tesseract-layer/releases/latest).

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
    description: 'AL2 Tesseract Layer',
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
## build (using AL2023 - recommended)
docker build -t tesseract-lambda-layer -f Dockerfile.al2023 .
## run container
export CONTAINER=$(docker run -d tesseract-lambda-layer false)
## copy tesseract files from container to local folder layer
docker cp $CONTAINER:/opt/build-dist layer
## remove Docker container
docker rm $CONTAINER
unset CONTAINER
```

## available `Dockerfile`s

| Dockerfile                              | Base-Image        | compatible Runtimes                                           | Status             |
| :-------------------------------------- | :---------------- | :------------------------------------------------------------ | :----------------- |
| `Dockerfile.al2023` (**recommended**)   | Amazon Linux 2023 | Python 3.12+, Node.js 20+, Ruby 3.2+, Java 17+                | ✅ **Active**      |
| `Dockerfile.al2`                        | Amazon Linux 2    | Python 3.8-3.11, Node.js 18, Ruby 2.7, Java 8/11              | ⚠️ **Deprecated**  |
| ~~`Dockerfile.al1`~~                    | ~~Amazon Linux 1~~| ~~Python 2.7/3.6/3.7, Ruby 2.5, Java 8, Go 1.x~~              | ❌ **Removed**     |


## Building a different tesseract version and/or language

By default, the build generates Tesseract 5.5.2 OCR libraries with the _fast_ german, english and osd (orientation and script detection) [data files](https://github.com/tesseract-ocr/tesseract/wiki/Data-Files) included.

The build process can be modified using different build time arguments (defined as `ARG` in `Dockerfile.al2` and `Dockerfile.al2023`), using the `--build-arg` option of `docker build`.

| Build-Argument           | description                                                                                                       | default value | available versions                                                                                                                        |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `TESSERACT_VERSION`      | the tesseract OCR engine                                                                                          | `5.5.2`       | https://github.com/tesseract-ocr/tesseract/releases                                                                                       |
| `LEPTONICA_VERSION`      | fundamental image processing and analysis library                                                                 | `1.87.0`      | https://github.com/danbloomberg/leptonica/releases                                                                                        |
| `OCR_LANG`               | Language to install (in addition to `eng` and `osd`)                                                              | `deu`         | https://github.com/tesseract-ocr/tessdata (`<lang>.traineddata`)                                                                          |
| `TESSERACT_DATA_SUFFIX`  | Trained LSTM models for tesseract. Can be empty (default), `_best` (best inference) and `_fast` (fast inference). | `_fast`       | https://github.com/tesseract-ocr/tessdata, https://github.com/tesseract-ocr/tessdata_best, https://github.com/tesseract-ocr/tessdata_fast |
| `TESSERACT_DATA_VERSION` | Version of the trained LSTM models for tesseract                                                                  | `4.1.0`       | https://github.com/tesseract-ocr/tessdata/releases/tag/4.1.0                                                                              |
| `COMPILER_FLAGS`         | C++ compiler flags for building Tesseract                                                                         | `"-mavx2 -std=c++17"` | Any valid CXXFLAGS (e.g., optimization level, CPU architecture, C++ standard)                                                             |


**Example of custom build**

```bash
## Build with French language support (recommended)
docker build --build-arg OCR_LANG=fra -t tesseract-lambda-layer-french -f Dockerfile.al2023 .

## Build with specific Tesseract version and language
docker build --build-arg TESSERACT_VERSION=5.0.0 --build-arg OCR_LANG=fra -t tesseract-lambda-layer -f Dockerfile.al2023 .

## Build with custom compiler optimizations (e.g., for different CPU architectures)
docker build --build-arg COMPILER_FLAGS="-march=native -O3 -std=c++17" -t tesseract-lambda-layer-optimized -f Dockerfile.al2023 .
```

## Deployment size optimization

The library files that are content of the layer are stripped, before deployment to make them more suitable for the lambda environment. See `Dockerfile`s:

```Dockerfile
RUN ... \
  find ${DIST}/lib -name '*.so*' | xargs strip -s
```

The stripping can cause issues, when the build runtime and the lambda runtime are different (e.g. if building on Amazon Linux 1 and running on Amazon Linux 2).

## Building the layer binaries directly using CDK

You can build the layer directly and get the artifacts (like in [ready-to-use](./ready-to-use/)). This is done using AWS CDK with the [`bundling` option](https://aws.amazon.com/blogs/devops/building-apps-with-aws-cdk/).

Refer to [continous-integration](./continous-integration/README.md) and the [corresponding Github Workflow](https://github.com/bweigel/aws-lambda-tesseract-layer/actions?query=workflow%3A%22Continuos+Integration%22) for an example.

## Layer contents

The layer contents get deployed to `/opt`, when used by a function. See [here](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) for details.
See [ready-to-use](./ready-to-use/) for layer contents for Amazon Linux 2023 and Amazon Linux 2.

# Migration from AL2 to AL2023

## Why Migrate?

- **Extended Support**: AL2023 receives updates until 2028
- **Modern Runtimes**: Python 3.12+, Node.js 20+
- **Performance**: Improved compiler optimizations and newer system libraries
- **Security**: Latest security patches and cryptographic libraries

## Migration Steps

### 1. Update Runtime

| Current Runtime | → | AL2023 Runtime |
|-----------------|---|----------------|
| Python 3.8-3.11 | → | Python 3.12    |
| Node.js 18      | → | Node.js 20     |
| Ruby 2.7        | → | Ruby 3.2       |

### 2. Update Layer Reference

**Serverless Framework**:
```yaml
# Before
layers:
  tesseractAl2:
    path: ready-to-use/amazonlinux-2
    compatibleRuntimes:
      - python3.8

# After
layers:
  tesseractAl2023:
    path: ready-to-use/amazonlinux-2023
    compatibleRuntimes:
      - python3.12
```

**AWS CDK**:
```typescript
// Before
const layer = new lambda.LayerVersion(stack, 'layer', {
  code: Code.fromAsset('ready-to-use/amazonlinux-2'),
});
new lambda.Function(stack, 'fn', {
  runtime: Runtime.PYTHON_3_8,
  layers: [layer],
});

// After
const layer = new lambda.LayerVersion(stack, 'layer', {
  code: Code.fromAsset('ready-to-use/amazonlinux-2023'),
});
new lambda.Function(stack, 'fn', {
  runtime: Runtime.PYTHON_3_12,
  layers: [layer],
});
```

### 3. Test Locally

```bash
# Update dependencies for new runtime
pip install --upgrade -r requirements.txt  # Python
npm update                                  # Node.js

# Test with SAM CLI
sam local invoke --runtime python3.12 ...
```

### 4. Deploy & Monitor

- Deploy to dev/staging environment first
- Check CloudWatch logs for compatibility issues
- Verify OCR functionality works correctly
- Roll out to production gradually

## Common Issues

**Python 3.12 Compatibility**
- Some packages need updates for Python 3.12
- Use `pip install --upgrade` for dependencies
- Check for deprecated Python APIs

**Node.js Native Modules**
- Native modules must be recompiled for AL2023
- Ensure node-gyp is up to date
- Test with `sam local invoke`

**Library Versions**
- AL2023 may have different .so library versions
- Error: "cannot open shared object file"
- Solution: Use the AL2023 layer (not AL2 layer)

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
