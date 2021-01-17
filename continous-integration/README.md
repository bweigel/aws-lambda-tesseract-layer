> This is used for integration testing and bundling purposes.

## Integration Testing

A simple CDK template uses the `Dockerfile` to bundle a layer containing tesseract.

Using `npx cdk synth` the CDK app is synthesized. The artifacts are bundled as this happens.
The output artifacts of the synth command (i.e. cloudformation template, layer, testing lambda) is put into `cdk.out` by the CDK.

AWS SAM CLI is used to invoke a testing function locally using the respective runtime and layer.
The result is checked for errors.

Commands to reproduce:

```
npm ci
npx cdk synth
## run integration test using AL1 & Python 3.6
npm npm run test:integration:al1
## run integration test using AL2 & Python 3.8
npm npm run test:integration:al2
```

## Bundling

After `npx cdk synth` was executed bundles of the binary can be created with `npm run bundle:binary:al1`.
The bundles will be put into the `ready-to-use` folder.