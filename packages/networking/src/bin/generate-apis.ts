#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  deriveHooksGeneratedPath,
  generateApisHooksModuleSource,
  generateApisModuleSource,
  readLibNetworkingOutputPaths,
} from '../generate-lib-apis.js';

function parseArgs(): { config: string; outputCli: string | undefined } {
  const args = process.argv.slice(2);
  let config = 'lib.config.json';
  let outputCli: string | undefined = undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--config' || a === '-c') {
      config = args[++i] ?? config;
    } else if (a === '--output' || a === '-o') {
      outputCli = args[++i] ?? outputCli;
    } else if (a === '--help' || a === '-h') {
      console.log(`Usage: lib-networking-generate [--config lib.config.json] [--output src/api/apis.generated.ts]
Paths: CLI --output overrides libNetworking.output in config; default is src/api/apis.generated.ts (cwd-relative).
Reads libNetworking.apis (object keyed by API name) and emits:
  - apis.generated.ts: createApiRegistry, export const apis, export const *Request per API
  - apis.client.generated.tsx: 'use client' + use*Request hooks (useAsyncFetch + apis.*)
Optional libNetworking.hooksOutput overrides the derived client module path.`);
      process.exit(0);
    }
  }
  return { config, outputCli };
}

function run() {
  const cwd = process.cwd();
  const { config: configRel, outputCli } = parseArgs();
  const configPath = resolve(cwd, configRel);
  const configDir = dirname(configPath);

  const raw = readFileSync(configPath, 'utf8');
  const json = JSON.parse(raw) as unknown;
  const { output: outputFromConfig, hooksOutput: hooksFromConfig } = readLibNetworkingOutputPaths(json);

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
  const source = generateApisModuleSource(json);
  const hooksSource = generateApisHooksModuleSource(json);

  mkdirSync(dirname(outputPath), { recursive: true });
  mkdirSync(dirname(hooksPath), { recursive: true });
  writeFileSync(outputPath, source, 'utf8');
  writeFileSync(hooksPath, hooksSource, 'utf8');
  console.log(`lib-networking-generate: wrote ${outputPath}`);
  console.log(`lib-networking-generate: wrote ${hooksPath}`);
}

run();
