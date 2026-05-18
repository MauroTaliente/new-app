#!/usr/bin/env node
import { writeThemeRuntimeFromConfig } from '../generate-theme-runtime.js';

const args = process.argv.slice(2);
let config = 'react33.config.json';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && args[i + 1]) {
    config = args[++i]!;
  }
}

const result = writeThemeRuntimeFromConfig({ configPath: config });
if (result.skipped) {
  console.log('react-theme-generate: no react33Theme in config, skipped.');
  process.exit(0);
}
console.log(`react-theme-generate: wrote ${result.outputPath}`);
