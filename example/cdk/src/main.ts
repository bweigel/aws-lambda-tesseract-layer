import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { App, DockerImage, Duration, Stack } from 'aws-cdk-lib';


const app = new App();
const stack = new Stack(app, 'tesseract-ocr-example-cdk-py38');

/**
 * Artifacts for AL 2
 */
const al2Layer = new lambda.LayerVersion(stack, 'al2-layer', {
    code: Code.fromAsset(path.resolve(__dirname, '../../../ready-to-use/amazonlinux-2')),
    description: 'AL2 Tesseract Layer',
});

const ocrFn = new lambda.Function(stack, 'python3.8', {
    code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers'),
    {
        bundling: {
            image: DockerImage.fromRegistry('lambci/lambda:build-python3.8'),
            command: ['/bin/bash', '-c', [
                'pip install -r requirements.txt -t /asset-output/',
                'cp handler.py /asset-output',
            ].join(' && ')],
        }
    }),
    runtime: Runtime.PYTHON_3_8,
    layers: [al2Layer],
    memorySize: 1024,
    timeout: Duration.seconds(10),
    handler: 'handler.main',
});

const api = new RestApi(stack, 'ocr-api');
const ocr = api.root.addResource('ocr');
ocr.addMethod('POST', new LambdaIntegration(ocrFn, {proxy: true}));


