import * as lambda from '@aws-cdk/aws-lambda';
import { Code, Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { App, BundlingDockerImage, Duration, Stack } from '@aws-cdk/core';


const app = new App();
const stack = new Stack(app, 'tesseract-lambda-test');

/**
 * Test setup and artifacts for AL 1
 */
const pathToLayerSource = path.resolve(__dirname, '..');
const al1Layer = new lambda.LayerVersion(stack, 'al1-layer', {
    code: Code.fromAsset(pathToLayerSource, {
    bundling: {
        image: BundlingDockerImage.fromAsset(pathToLayerSource),
        command: ['/bin/bash', '-c', 'cp -r /opt/build-dist/. /asset-output/'],
    },
    }),
    description: 'AL1 Tesseract Layer',
});

new lambda.Function(stack, 'python3.6', {
    code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers'),
    {
        bundling: {
            image: BundlingDockerImage.fromRegistry('lambci/lambda:build-python3.6'),
            command: ['/bin/bash', '-c', [
                'pip install -r requirements.txt -t /asset-output/',
                'cp faust.png /asset-output',
                'cp handler.py /asset-output',
            ].join(' && ')],
        }
    }),
    runtime: Runtime.PYTHON_3_6,
    layers: [al1Layer],
    memorySize: 512,
    timeout: Duration.seconds(30),
    functionName: `al1-py36`,
    handler: 'handler.main',
});

/**
 * Test setup and artifacts for AL 2
 */
// const al2Layer = new lambda.LayerVersion(stack, 'al2-layer', {
//     code: Code.fromAsset(pathToLayerSource, {
//     bundling: {
//         image: BundlingDockerImage.fromAsset(pathToLayerSource),
//         command: ['/bin/bash', '-c', 'cp -r /opt/build-dist/. /asset-output/'],
//     },
//     }),
//     description: 'AL1 Tesseract Layer',
// });
new lambda.Function(stack, 'python3.8', {
    code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers'),
    {
        bundling: {
            image: BundlingDockerImage.fromRegistry('lambci/lambda:build-python3.8'),
            command: ['/bin/bash', '-c', [
                'pip install -r requirements.txt -t /asset-output/',
                'cp faust.png /asset-output',
                'cp handler.py /asset-output',
            ].join(' && ')],
        }
    }),
    runtime: Runtime.PYTHON_3_8,
    layers: [al1Layer],
    functionName: `al2-py38`,
    memorySize: 512,
    timeout: Duration.seconds(30),
    handler: 'handler.main',
});

