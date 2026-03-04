Ready to use tesseract binaries
===

> Contains ready-to-use binaries for Tesseract for [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) using Amazon Linux 2023 and 2 on X86 architecture.

## ✅ Amazon Linux 2023 (X86) - RECOMMENDED

**Directory**: [`./amazonlinux-2023`](./amazonlinux-2023)

### Compatible Runtimes

- Python 3.12 ✅ (tested), 3.13
- Node.js 20 ✅ (tested), 22
- Ruby 3.2
- Java 17, 21
- .NET 6, 8

✅ = Verified working with integration tests

### Usage

See main [README.md](../README.md) for usage instructions.

---

## ⚠️ Amazon Linux 2 (X86) - DEPRECATED

**Directory**: [`./amazonlinux-2`](./amazonlinux-2)

> **Warning**: Amazon Linux 2 support will be removed in 6 months. Please migrate to AL2023.

### Compatible Runtimes

- Python 3.8, 3.9, 3.10, 3.11
- Node.js 18
- Ruby 2.7
- Java 8 (Corretto), 11 (Corretto)
- .NET Core 3.1


### Migration

See [Migration Guide](../README.md#migration-from-al2-to-al2023) in main README.
