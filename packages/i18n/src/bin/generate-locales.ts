#!/usr/bin/env node

import { writeI18nFromConfig } from '../generate-locales.js';

function parseArgs(): { config: string } {
  const args = process.argv.slice(2);
  let config = 'react33.config.json';
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--config' || a === '-c') {
      config = args[++i] ?? config;
    } else if (a === '--help' || a === '-h') {
      console.log(`Usage: react-i18n-generate [--config react33.config.json]

Reads react33I18n from react33.config.json and writes:
  - typesOutput (default ./src/lib/i18n/i18n.generated.ts)
  - runtimeOutput (default ./src/lib/i18n/i18n.runtime.generated.tsx)`);
      process.exit(0);
    }
  }
  return { config };
}

async function run() {
  const { config } = parseArgs();
  const result = await writeI18nFromConfig({ configPath: config });
  if (result.skipped) {
    console.log('react-i18n-generate: no react33I18n in config — skip');
    return;
  }
  console.log(`react-i18n-generate: wrote ${result.outputPath}`);
  if (result.runtimeOutputPath) {
    console.log(`react-i18n-generate: wrote ${result.runtimeOutputPath}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
