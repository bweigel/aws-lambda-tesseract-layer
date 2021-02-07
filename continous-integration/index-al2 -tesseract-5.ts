import * as lambda from '@aws-cdk/aws-lambda';
import { CfnLayerVersion, Code, Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { App, BundlingDockerImage, Duration, Stack } from '@aws-cdk/core';


const app = new App();
const stack = new Stack(app, 'tesseract-lambda-ci');
const pathToLayerSource = path.resolve(__dirname, '..');
/**
 * Test setup and artifacts for AL 2 - Tesseract 5
 */
const al2tess5Layer = new lambda.LayerVersion(stack, 'al2tess5-layer', {
    code: Code.fromAsset(pathToLayerSource, {
    bundling: {
        image: BundlingDockerImage.fromAsset(pathToLayerSource, { file: '../Dockerfile.al2-tesseract5' }),
        command: ['/bin/bash', '-c', 'cp -r /opt/build-dist/. /asset-output/'],
    },
    }),
    description: 'AL2 Tesseract 5 Layer',
});
stack.renameLogicalId(stack.getLogicalId(al2tess5Layer.node.defaultChild as CfnLayerVersion), 'al2tess5layer')
new lambda.Function(stack, 'python3.8-tess5', {
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
    layers: [al2tess5Layer],
    functionName: `al2-tess5-py38`,
    memorySize: 512,
    timeout: Duration.seconds(30),
    handler: 'handler.main',
});
