#!/bin/bash

set -euxo

pushd .
cd ready-to-use/amazonlinux-2
zip -r ../layer-al2.zip *
popd

