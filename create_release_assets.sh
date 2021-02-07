#!/bin/bash

set -euxo

pushd .
cd ready-to-use/amazonlinux-1
zip -r ../layer-al1.zip *
popd
pushd .
cd ready-to-use/amazonlinux-2
zip -r ../layer-al2.zip *
popd
pushd .
cd ready-to-use/amazonlinux-2-tesseract-5
zip -r ../layer-al2-tesseract-5.zip *
popd
