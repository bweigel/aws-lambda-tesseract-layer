import * as path from 'path';
import { App, DockerImage, Duration, Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnLayerVersion, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as nodelambda from 'aws-cdk-lib/aws-lambda-nodejs';

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
stack.renameLogicalId(stack.getLogicalId(al2Layer.node.defaultChild as CfnLayerVersion), 'al2layer');

new lambda.Function(stack, 'python', {
  code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda-handlers/python'), {
    bundling: {
      image: DockerImage.fromRegistry('public.ecr.aws/sam/build-python3.10:latest'),
      command: [
        '/bin/bash',
        '-c',
        ['pip install -r requirements.txt -t /asset-output/', 'cp faust.png /asset-output', 'cp handler.py /asset-output'].join(' && '),
      ],
    },
  }),
  runtime: Runtime.PYTHON_3_10,
  layers: [al2Layer],
  functionName: `python`,
  memorySize: 512,
  timeout: Duration.seconds(30),
  handler: 'handler.main',
});

new nodelambda.NodejsFunction(stack, 'node', {
  bundling: {
    nodeModules: ['tesseractocr'],
    commandHooks: {
      beforeInstall() {
        return [];
      },
      beforeBundling(inputDir: string, outputDir: string): string[] {
        return [`cp ${inputDir}/faust.png ${outputDir}`];
      },
      afterBundling(): string[] {
        return [];
      },
    },
  },
  depsLockFilePath: path.resolve(__dirname, 'lambda-handlers/node/yarn.lock'),

  runtime: Runtime.NODEJS_18_X,
  entry: path.resolve(__dirname, 'lambda-handlers/node/index.js'),
  layers: [al2Layer],
  functionName: `node`,
  memorySize: 512,
  timeout: Duration.seconds(30),
  handler: 'handler',
});
