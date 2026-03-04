# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository builds AWS Lambda layers containing Tesseract OCR libraries and the tesseract command-line binary. It supports Amazon Linux 2023 (recommended) and Amazon Linux 2 (deprecated) runtimes, with ready-to-use binaries and Docker-based build processes.

## Key Architecture

### Projen-based Repository Management

- All repository configuration is managed through `.projenrc.ts`
- Run `npx projen` to regenerate configuration files after editing `.projenrc.ts`
- The project uses projen to manage nested subprojects (example/cdk, continous-integration/lambda-handlers/node)

### Docker Build System

Two Dockerfiles build the Tesseract layer for different Amazon Linux versions:
- `Dockerfile.al2023` - Amazon Linux 2023 (**recommended** - Python 3.12+, Node.js 20+, Ruby 3.2+, Java 17+)
- `Dockerfile.al2` - Amazon Linux 2 (**deprecated** - Python 3.8-3.11, Node.js 18, Ruby 2.7, Java 8/11)

Amazon Linux 1 support has been removed.

The Dockerfiles compile Tesseract OCR and Leptonica from source with configurable build arguments:
- `TESSERACT_VERSION` - tesseract version to build
- `LEPTONICA_VERSION` - leptonica version to build
- `OCR_LANG` - additional language data to include (beyond eng/osd)
- `TESSERACT_DATA_SUFFIX` - traineddata variant: empty (default), `_best`, or `_fast`
- `TESSERACT_DATA_VERSION` - version of trained models (currently 4.1.0)

### Integration Testing & Bundling

Located in `continous-integration/`:
- `main.ts` - CDK app that builds layers using Docker bundling and creates test Lambda functions
- `lambda-handlers/python/` - Python handler for testing
- `lambda-handlers/node/` - Node.js handler for testing

The CI/CD flow:
1. `npx cdk synth` synthesizes the stack and bundles layer artifacts via Docker
2. AWS SAM CLI locally invokes test functions with the built layer
3. Test output is checked for errors
4. Successful builds copy artifacts to `ready-to-use/amazonlinux-2023/` and `ready-to-use/amazonlinux-2/`

### Ready-to-use Artifacts

The `ready-to-use/` directory contains pre-built layer binaries:
- `amazonlinux-2023/` - **Recommended** layer contents for AL2023-based runtimes
- `amazonlinux-2/` - **Deprecated** layer contents for AL2-based runtimes (will be removed)
- These are deployed to `/opt` when attached to a Lambda function

## Essential Commands

### Building & Testing

```bash
# Install dependencies (runs across all subprojects)
npm ci

# Build the project (compile TypeScript)
npm run build

# Run unit tests
npm test

# Synthesize CDK stack (triggers Docker build of layer)
npm run synth

# Run integration tests (requires Docker and SAM CLI, AL2023 only)
npm run test:integration          # All AL2023 tests
npm run test:integration:al2023   # AL2023 tests (Python 3.12 + Node.js 20)
npm run test:integration:python312 # Python 3.12 (AL2023) test
npm run test:integration:node20   # Node.js 20 (AL2023) test

# Bundle ready-to-use artifacts after synth
npm run bundle:binary

# Create release assets (zip files)
npm run package
```

### Linting

```bash
npm run eslint
```

### Building Custom Layers

```bash
# Build AL2023 layer (recommended)
docker build --build-arg TESSERACT_VERSION=5.5.2 \
  --build-arg OCR_LANG=fra \
  -t tesseract-lambda-layer \
  -f Dockerfile.al2023 .

# Build AL2 layer (deprecated)
docker build -t tesseract-lambda-layer -f Dockerfile.al2 .

# Extract built artifacts from container
export CONTAINER=$(docker run -d tesseract-lambda-layer false)
docker cp $CONTAINER:/opt/build-dist layer
docker rm $CONTAINER
unset CONTAINER
```

### Upgrading Dependencies

```bash
# Upgrade all dependencies (JavaScript)
npm run upgrade

# Upgrade Python dependencies in CI handlers
npm run upgrade:ci:py

# Upgrade all subprojects
npm run upgrade:subprojects
```

## CDK Usage Patterns

This repository uses CDK's Docker bundling feature extensively:

```typescript
// Building a layer from Docker
const layer = new lambda.LayerVersion(stack, 'layer', {
  code: Code.fromAsset(pathToSource, {
    bundling: {
      image: DockerImage.fromBuild(path, { file: 'Dockerfile.al2' }),
      command: ['/bin/bash', '-c', 'cp -r /opt/build-dist/. /asset-output/'],
    },
  }),
});
```

The bundling happens during `cdk synth`, not during `cdk deploy`. Artifacts are cached in `cdk.out/`.

## Example Projects

Two example projects demonstrate layer usage:

### Serverless Framework (`example/serverless/`)
- References `ready-to-use/amazonlinux-2/` via `layers.path` in `serverless.yml`
- Uses serverless-python-requirements plugin with Docker

### AWS CDK (`example/cdk/`)
- Creates LayerVersion from `ready-to-use/amazonlinux-2/` using `Code.fromAsset()`
- Separate projen subproject with its own dependencies

## Important Notes

- Library files are stripped during build (using `strip -s`) to reduce size
- Stripping can cause issues if build runtime differs from Lambda runtime - use matching base images
- The layer includes tesseract binaries in `/opt/bin` and libraries in `/opt/lib`
- Ready-to-use artifacts are tracked in git for convenience (large binary files)
- Release workflow is scheduled annually (Jan 1) via projen `releaseTrigger`
- Dependency upgrades run weekly via GitHub Actions with projen credentials from GitHub App
