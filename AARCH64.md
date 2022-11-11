qemu-user-static [1]

## How-To

**Setup machone to be able to build-multi architecture images**

Download qemu binaries and register binfmt_misc entries:

```shell
# check host architecture (only x86_64 supported atm)
uname -m
> x86_64
# enable the execution of different multi-architecture containers by QEMU
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```

**Build images for amd64 and aarch64**

```shell
docker buildx build --platform linux/amd64,linux/arm64 -t tesseract-lambda-layer -f Dockerfile.al2 .
```

```
export CONTAINER=$(docker run -d tesseract-lambda-layer-aarch64 false)
docker cp $CONTAINER:/opt/build-dist ready-to-use/amazonlinux-2-aarch64
docker rm $CONTAINER
unset CONTAINER
```


---

[1]: https://github.com/multiarch/qemu-user-static