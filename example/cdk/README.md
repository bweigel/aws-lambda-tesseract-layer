Example: AWS Lambda with Tesseract layer
===

### Requirements

- Docker
- Node.Js

### Deploy Stack

```bash
## install dependencies
npm ci
## if you haven't already, you need to bootstrap your account to work with cdk
npx cdk bootstrap
## deploy
npx cdk deploy
```

![Deployment](./deployment.png)

### Invoke your API with an URL to an Image

```bash
curl -X POST \
  https://i61tt4wbth.execute-api.eu-central-1.amazonaws.com/dev/ocr \
  -d https://upload.wikimedia.org/wikipedia/de/e/eb/Goethe_Faust_Textbeispiel_Grossschreibung.png
```

### Remove Stack

```
npx cdk destroy
```