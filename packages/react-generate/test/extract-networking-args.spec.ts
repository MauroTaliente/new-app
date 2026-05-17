import { describe, expect, it } from 'vitest';
import { extractNetworkingArgs } from '../src/extract-networking-args.js';

describe('extractNetworkingArgs', () => {
  it('extrae --config y su valor', () => {
    expect(extractNetworkingArgs(['--verbose', '--config', './cfg.json', '--watch'])).toEqual([
      '--config',
      './cfg.json',
    ]);
  });

  it('extrae -c y -o', () => {
    expect(extractNetworkingArgs(['-c', 'app.json', '-o', './src/api'])).toEqual([
      '--config',
      'app.json',
      '--output',
      './src/api',
    ]);
  });

  it('ignora flag sin valor al final', () => {
    expect(extractNetworkingArgs(['--verbose', '--config'])).toEqual([]);
  });

  it('usa el siguiente token como valor aunque sea otro flag', () => {
    expect(extractNetworkingArgs(['--config', '--output'])).toEqual(['--config', '--output']);
  });

  it('devuelve vacío si no hay flags de networking', () => {
    expect(extractNetworkingArgs(['--domains', 'tokens', 'theme'])).toEqual([]);
  });
});
