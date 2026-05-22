#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  deriveHooksGeneratedPath,
  generateApisHooksModuleSource,
  generateApisModuleSource,
  readReact33NetworkingOutputPaths,
} from '../generate-react33-apis.js';
import { writeOpenApiBundles } from '../generate-openapi-bundle.js';
import { mergeOpenApiIntoApisConfig } from '../merge-openapi-apis.js';

function parseArgs(): { config: string; outputCli: string | undefined } {
  const args = process.argv.slice(2);
  let config = 'react33.config.json';
  let outputCli: string | undefined = undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--config' || a === '-c') {
      config = args[++i] ?? config;
    } else if (a === '--output' || a === '-o') {
      outputCli = args[++i] ?? outputCli;
    } else if (a === '--help' || a === '-h') {
      console.log(`Usage: react-networking-generate [--config react33.config.json] [--output src/api/apis.generated.ts]
Paths: CLI --output overrides react33Networking.registryOutput in config; default is src/api/apis.generated.ts (cwd-relative).
Reads react33Networking.apis (object keyed by API name) and emits:
  - apis.generated.ts: createApiRegistry, export const apis, export const *Request per API
  - apis.client.generated.tsx: 'use client' + use*Request hooks (useAsyncFetch + apis.*)
Optional react33Networking.hooksOutput overrides the derived client module path.`);
      process.exit(0);
    }
  }
  return { config, outputCli };
}

async function run() {
  const cwd = process.cwd();
  const { config: configRel, outputCli } = parseArgs();
  const configPath = resolve(cwd, configRel);
  const configDir = dirname(configPath);

  const raw = readFileSync(configPath, 'utf8');
  const json = JSON.parse(raw) as unknown;
  const { registryOutput: outputFromConfig, hooksOutput: hooksFromConfig } =
    readReact33NetworkingOutputPaths(json);

  let outputPath: string;
  if (outputCli !== undefined) {
    outputPath = resolve(cwd, outputCli);
  } else if (outputFromConfig !== undefined) {
    outputPath = resolve(configDir, outputFromConfig);
  } else {
    outputPath = resolve(cwd, 'src/api/apis.generated.ts');
  }

  const hooksPath =
    hooksFromConfig !== undefined ? resolve(configDir, hooksFromConfig) : deriveHooksGeneratedPath(outputPath);

  const mergedJson = await mergeOpenApiIntoApisConfig(json, configDir);
  const source = generateApisModuleSource(mergedJson);
  const hooksSource = generateApisHooksModuleSource(mergedJson);

  mkdirSync(dirname(outputPath), { recursive: true });
  mkdirSync(dirname(hooksPath), { recursive: true });
  writeFileSync(outputPath, source, 'utf8');
  writeFileSync(hooksPath, hooksSource, 'utf8');
  console.log(`react-networking-generate: wrote ${outputPath}`);
  console.log(`react-networking-generate: wrote ${hooksPath}`);

  await writeOpenApiBundles(mergedJson, configDir, outputPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
