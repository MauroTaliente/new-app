#!/usr/bin/env node

/**
 * Runs `react-styles-generate` then `react-networking-generate` so one command
 * refreshes CSS-derived tokens and API registry + client hooks from `react33.config.json`.
 */

import { resolvePackageBin } from '../resolve-package-bin.js';
import { runReactGenerate } from '../run-react-generate.js';

const stylesBin = resolvePackageBin('@react33/react-styles', 'generate-tokens.js');
const networkingBin = resolvePackageBin('@react33/react-networking', 'generate-apis.js');
const i18nBin = resolvePackageBin('@react33/react-i18n', 'generate-locales.js');
const themeBin = resolvePackageBin('@react33/react-theme', 'generate-theme-runtime.js');

process.exit(
  runReactGenerate(process.argv.slice(2), {
    stylesBin,
    networkingBin,
    i18nBin,
    themeBin,
  }),
);
