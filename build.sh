#!/bin/bash -x

#######################
######## USAGE ########
# ./build.sh amazonLinuxVersionNumber prefix
# usually
# ./build.sh 1 amazonlinux-1 or ./build.sh 2 amazonlinux-2

set -euo pipefail
AL_VERSION=$1
PREFIX=$2

rm -rf ready-to-use/${PREFIX}
docker build -t bweigel/${PREFIX} -f Dockerfile.al${AL_VERSION} .
CONTAINER=$(docker run -d bweigel/${PREFIX} false)
docker cp $CONTAINER:/opt/build-dist ready-to-use/${PREFIX}
docker rm $CONTAINER

