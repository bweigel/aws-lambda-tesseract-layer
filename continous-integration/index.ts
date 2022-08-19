import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnLayerVersion, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { App, DockerImage, Duration, Stack } from 'aws-cdk-lib';


const app = new App();
const stack = new Stack(app, 'tesseract-lambda-ci');
const pathToLayerSource = path.resolve(__dirname, '..');
/**
 * Test setup and artifacts for AL 2
 */
const al2Layer = new lambda.LayerVersion(stack, 'al2-layer', {
    code: Code.fromAsset(pathToLayerSource, {
    bundling: {
        image: DockerImage.fromBuild(pathToLayerSource, { file: 'Dockerfile.al2' }),
        command: ['/bin/bash', '-c', 'cp -r /opt/build-dist/. /asset-output/'],
    },
    }),
    description: 'AL2 Tesseract Layer',
});
stack.renameLogicalId(stack.getLogicalId(al2Layer.node.defaultChild as CfnLayerVersion), 'al2layer')

new lambda.Function(stack, 'python3.8', {
    code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers/py38'),
    {
        bundling: {
            image: DockerImage.fromRegistry('lambci/lambda:build-python3.8'),
            command: ['/bin/bash', '-c', [
                'pip install -r requirements.txt -t /asset-output/',
                'cp faust.png /asset-output',
                'cp handler.py /asset-output',
            ].join(' && ')],
        }
    }),
    runtime: Runtime.PYTHON_3_8,
    layers: [al2Layer],
    functionName: `py38`,
    memorySize: 512,
    timeout: Duration.seconds(30),
    handler: 'handler.main',
});

