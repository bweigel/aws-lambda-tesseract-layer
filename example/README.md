Example: AWS Lambda with Tesseract layer
===

## How-To

### Deploy

```bash
sls deploy
```

![Deployment](./deployment.png)

### Invoke your API with an URL to an Image

```bash
curl -X POST \
  https://i61tt4wbth.execute-api.eu-central-1.amazonaws.com/dev/ocr \
  -d https://www.flowfinder.de/wp-content/themes/tpa/images/motivation/ernest-hemingway.jpg
```

