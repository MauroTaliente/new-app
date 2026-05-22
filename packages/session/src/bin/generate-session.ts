#!/usr/bin/env node
import { writeSessionRuntimeFromConfig } from '../generate-session-runtime.js';

const args = process.argv.slice(2);
let config = 'react33.config.json';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && args[i + 1]) {
    config = args[++i]!;
  }
}

const result = writeSessionRuntimeFromConfig({ configPath: config });
if (result.skipped) {
  console.log('react-session-generate: no react33Session in config, skipped.');
  process.exit(0);
}
console.log(`react-session-generate: wrote ${result.agnosticPath}`);
if (result.clientPath) {
  console.log(`react-session-generate: wrote ${result.clientPath}`);
}
