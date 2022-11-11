import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Architecture, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { App, DockerImage, Duration, Stack } from 'aws-cdk-lib';


const app = new App();
const stack = new Stack(app, 'tesseract-ocr-example-cdk-py38', {tags: {'owner': 'bgenz'}});

/**
 * Artifacts for AL 2
 */
const amdLayer = new lambda.LayerVersion(stack, 'amd-layer', {
    code: Code.fromAsset(path.resolve(__dirname, '../../ready-to-use/amazonlinux-2')),
    description: 'AL2 Tesseract Layer - AMD64',
});
const aarchLayer = new lambda.LayerVersion(stack, 'aarch-layer', {
    code: Code.fromAsset(path.resolve(__dirname, '../../ready-to-use/amazonlinux-2-aarch64')),
    description: 'AL2 Tesseract Layer - AARCH64',
});

const ocrFnAmd = new lambda.Function(stack, 'python3.8-amd', {
    code: lambda.Code.fromDockerBuild(path.resolve(__dirname, 'lambda-handlers'),
    {
        platform: 'linux/amd64',
        file: 'Dockerfile',
    }),
    runtime: Runtime.PYTHON_3_8,
    architecture: Architecture.X86_64,
    layers: [amdLayer],
    memorySize: 1024,
    timeout: Duration.seconds(10),
    handler: 'handler.main',
});

const ocrFnAarch = new lambda.Function(stack, 'python3.8-aarch', {
    code: lambda.Code.fromDockerBuild(path.resolve(__dirname, 'lambda-handlers'),
    {
        platform: 'linux/arm64',
        file: 'Dockerfile',
    }),
    runtime: Runtime.PYTHON_3_8,
    architecture: Architecture.ARM_64,
    layers: [amdLayer],
    memorySize: 1024,
    timeout: Duration.seconds(10),
    handler: 'handler.main',
});

const api = new RestApi(stack, 'ocr-api');
const amd = api.root.addResource('amd');
const arm = api.root.addResource('arm');
amd.addMethod('POST', new LambdaIntegration(ocrFnAmd, {proxy: true}));
arm.addMethod('POST', new LambdaIntegration(ocrFnAarch, {proxy: true}));


