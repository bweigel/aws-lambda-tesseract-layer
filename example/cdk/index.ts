import * as lambda from '@aws-cdk/aws-lambda';
import { Code, Runtime } from '@aws-cdk/aws-lambda';
import { RestApi, LambdaIntegration } from '@aws-cdk/aws-apigateway';
import * as path from 'path';
import { App, BundlingDockerImage, Stack } from '@aws-cdk/core';


const app = new App();
const stack = new Stack(app, 'tesseract-ocr-example-cdk-py36');

/**
 * Test setup and artifacts for AL 1
 */
const al1Layer = new lambda.LayerVersion(stack, 'al1-layer', {
    code: Code.fromAsset(path.resolve(__dirname, '../../ready-to-use/amazonlinux-1')),
    description: 'AL1 Tesseract Layer',
});

const ocrFn = new lambda.Function(stack, 'python3.6', {
    code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers'),
    {
        bundling: {
            image: BundlingDockerImage.fromRegistry('lambci/lambda:build-python3.6'),
            command: ['/bin/bash', '-c', [
                'pip install -r requirements.txt -t /asset-output/',
                'cp handler.py /asset-output',
            ].join(' && ')],
        }
    }),
    runtime: Runtime.PYTHON_3_6,
    layers: [al1Layer],
    memorySize: 512,
    handler: 'handler.main',
});

const api = new RestApi(stack, 'ocr-api');
const ocr = api.root.addResource('ocr');
ocr.addMethod('POST', new LambdaIntegration(ocrFn, {proxy: true}));


