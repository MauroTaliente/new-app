#!/usr/bin/env node

import chokidar from 'chokidar';
import path from 'path';
import { generateTokens, resolveGenerateOptions } from '../generate.js';

function parseDomainsArg(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

function parseArgs(): {
  fromCssDir?: string;
  inputTokensCss?: string;
  inputPaletteCss?: string;
  inputThemeCss?: string;
  domains?: string[];
  output?: string;
  config?: string;
  noConfig?: boolean;
  watch?: boolean;
  verbose?: boolean;
} {
  const args = process.argv.slice(2);
  const result: {
    fromCssDir?: string;
    inputTokensCss?: string;
    inputPaletteCss?: string;
    inputThemeCss?: string;
    domains?: string[];
    output?: string;
    config?: string;
    noConfig?: boolean;
    watch?: boolean;
    verbose?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--from-css' || arg === '--css-dir') {
      result.fromCssDir = args[++i];
    } else if (arg === '--domains') {
      result.domains = parseDomainsArg(args[++i]);
    } else if (arg === '--tokens-css') {
      result.inputTokensCss = args[++i];
    } else if (arg === '--palette-css') {
      result.inputPaletteCss = args[++i];
    } else if (arg === '--theme-css') {
      result.inputThemeCss = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      result.output = args[++i];
    } else if (arg === '--config' || arg === '-c') {
      result.config = args[++i];
    } else if (arg === '--no-config') {
      result.noConfig = true;
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg === '--watch' || arg === '-w') {
      result.watch = true;
    } else if (arg === '--no-watch') {
      result.watch = false;
    }
  }
  return result;
}

async function run() {
  const {
    fromCssDir,
    inputTokensCss,
    inputPaletteCss,
    inputThemeCss,
    domains,
    output,
    config,
    noConfig,
    watch,
    verbose,
  } = parseArgs();

  const cwd = process.cwd();

  const opts = {
    cwd,
    fromCssDir: fromCssDir ? path.resolve(cwd, fromCssDir) : undefined,
    inputTokensCss: inputTokensCss ? path.resolve(cwd, inputTokensCss) : undefined,
    inputPaletteCss: inputPaletteCss ? path.resolve(cwd, inputPaletteCss) : undefined,
    inputThemeCss: inputThemeCss ? path.resolve(cwd, inputThemeCss) : undefined,
    domains,
    outputDir: output ? path.resolve(cwd, output) : undefined,
    configPath: config ? path.resolve(cwd, config) : undefined,
    skipConfig: noConfig === true,
    verbose,
    watch,
  };

  const merged = resolveGenerateOptions(opts);

  const doGenerate = () => generateTokens(opts);

  await doGenerate();

  const shouldWatch = merged.watch;
  if (shouldWatch) {
    const watchDir = merged.fromCssDir;

    chokidar
      .watch(watchDir, {
        depth: 0,
        ignoreInitial: true,
      })
      .on('all', (_event, filePath) => {
        if (typeof filePath === 'string' && filePath.endsWith('.css') && !filePath.endsWith('.generated.css')) {
          console.log('Change detected, regenerating...');
          doGenerate();
        }
      });

    console.log('Watching for changes in', watchDir);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
