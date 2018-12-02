Example: AWS Lambda with Tesseract layer
===

## How-To

### Deploy

```bash
$ sls deploy
Serverless: Generated requirements from /home/bweigel/Projects/OSS/aws-lambda-tesseract-layer/example/requirements.txt in /home/bweigel/Projects/OSS/aws-lambda-tesseract-layer/example/.serverless/requirements.txt...
Serverless: Installing requirements from /home/bweigel/Projects/OSS/aws-lambda-tesseract-layer/example/.serverless/requirements/requirements.txt ...
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Injecting required Python packages to package...
<AWS Pseudo Parameters
Skipping automatic replacement of regions with account region!
AWS Pseudo Parameter: Resources::TesseractDashocrLambdaFunction::Properties::Layers::0 Replaced AWS::Region with ${AWS::Region}
AWS Pseudo Parameter: Resources::TesseractDashocrLambdaFunction::Properties::Layers::0 Replaced AWS::AccountId with${AWS::AccountId}
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service .zip file to S3 (3.23 MB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
..............
Serverless: Stack update finished...
Service Information
service: tesseract-ocr-example
stage: dev
region: eu-central-1
stack: tesseract-ocr-example-dev
api keys:
  None
endpoints:
  POST - https://XXXXXXXXXX.execute-api.eu-central-1.amazonaws.com/dev/ocr
functions:
  tesseract-ocr: tesseract-ocr-example-dev-tesseract-ocr
layers:
  None
```

### Invoke your API with an URL to an Image

```bash
curl -X POST \
  https://XXXXXXXXXX.execute-api.eu-central-1.amazonaws.com/dev/ocr \
  -d http://www.weihnachtsgedichte-sprueche.net/weihnachtswuensche/spruchbilder/traeumeindiewelt.jpg
```

