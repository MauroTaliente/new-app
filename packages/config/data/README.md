# Shared reference assets (`packages/config/data`)

Static files for **schema validation tests** and **networking/OpenAPI fixtures**. Nothing here is generated or executed at runtime.

| Path | Purpose |
|------|---------|
| [`fixtures/openapi-3.1-demo.yaml`](fixtures/openapi-3.1-demo.yaml) | Sample OpenAPI 3.1 for `@react33/react-networking` tests |
| [`examples/react33.config.minimal.json`](examples/react33.config.minimal.json) | Small valid `react33.config.json` example |
| [`examples/react33.config.full.json`](examples/react33.config.full.json) | Full contract example (OpenAPI outputs under `./.codegen/` are illustrative only) |
| [`examples/react33.config.invalid.json`](examples/react33.config.invalid.json) | Negative fixture for schema tests |

The live app config is [`apps/demo/react33.config.json`](../../../apps/demo/react33.config.json).

Do **not** run `react-generate` with `cwd` set to this folder; paths in examples are documentation placeholders.
