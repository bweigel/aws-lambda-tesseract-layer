#!/bin/bash -x

set -e

rm -rf layer
docker build -t bweigel/ocr_layer .
CONTAINER=$(docker run -d bweigel/ocr_layer false)
docker cp $CONTAINER:/opt/build-dist layer
docker rm $CONTAINER

