import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { App, DockerImage, Duration, Stack } from 'aws-cdk-lib';


const app = new App();
const stack = new Stack(app, 'tesseract-ocr-example-cdk-py312');

/**
 * Artifacts for AL 2023
 */
const al2023Layer = new lambda.LayerVersion(stack, 'al2023-layer', {
    code: Code.fromAsset(path.resolve(__dirname, '../../../ready-to-use/amazonlinux-2023')),
    description: 'AL2023 Tesseract Layer',
});

const ocrFn = new lambda.Function(stack, 'python3.12', {
    code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers'),
    {
        bundling: {
            image: DockerImage.fromRegistry('public.ecr.aws/sam/build-python3.12:latest'),
            command: ['/bin/bash', '-c', [
                'pip install -r requirements.txt -t /asset-output/',
                'cp handler.py /asset-output',
            ].join(' && ')],
        }
    }),
    runtime: Runtime.PYTHON_3_12,
    layers: [al2023Layer],
    memorySize: 1024,
    timeout: Duration.seconds(10),
    handler: 'handler.main',
});

const api = new RestApi(stack, 'ocr-api');
const ocr = api.root.addResource('ocr');
ocr.addMethod('POST', new LambdaIntegration(ocrFn, {proxy: true}));


