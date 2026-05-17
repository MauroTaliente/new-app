import { describe, expect, it, vi } from 'vitest';
import { runReactGenerate, REACT_GENERATE_HELP } from '../src/run-react-generate.js';

describe('runReactGenerate', () => {
  it('imprime help y retorna 0', () => {
    const log = vi.fn();
    const spawn = vi.fn();

    const code = runReactGenerate(['--help'], {
      stylesBin: '/styles.js',
      networkingBin: '/net.js',
      spawn: spawn as never,
      log,
    });

    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith(REACT_GENERATE_HELP);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('corre styles con argv completo y networking solo con config/output', () => {
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 });

    const code = runReactGenerate(
      ['--config', './react33.config.json', '--domains', 'tokens', '-o', './out/api.ts'],
      {
        stylesBin: '/pkg/styles/bin/generate-tokens.js',
        networkingBin: '/pkg/net/bin/generate-apis.js',
        execPath: '/usr/bin/node',
        cwd: '/app',
        spawn: spawn as never,
      },
    );

    expect(code).toBe(0);
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(spawn.mock.calls[0]).toEqual([
      '/usr/bin/node',
      ['/pkg/styles/bin/generate-tokens.js', '--config', './react33.config.json', '--domains', 'tokens', '-o', './out/api.ts'],
      { stdio: 'inherit', cwd: '/app' },
    ]);
    expect(spawn.mock.calls[1]).toEqual([
      '/usr/bin/node',
      ['/pkg/net/bin/generate-apis.js', '--config', './react33.config.json', '--output', './out/api.ts'],
      { stdio: 'inherit', cwd: '/app' },
    ]);
  });

  it('no ejecuta networking si styles falla', () => {
    const spawn = vi.fn().mockReturnValueOnce({ status: 2 });

    const code = runReactGenerate(['--config', 'x.json'], {
      stylesBin: '/styles.js',
      networkingBin: '/net.js',
      spawn: spawn as never,
    });

    expect(code).toBe(2);
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('retorna 1 si styles reporta error de spawn', () => {
    const logError = vi.fn();
    const spawn = vi.fn().mockReturnValueOnce({ status: 0, error: new Error('ENOENT') });

    const code = runReactGenerate([], {
      stylesBin: '/missing.js',
      networkingBin: '/net.js',
      spawn: spawn as never,
      logError,
    });

    expect(code).toBe(1);
    expect(logError).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('retorna 1 si networking reporta error de spawn', () => {
    const logError = vi.fn();
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0, error: new Error('ENOENT') });

    const code = runReactGenerate([], {
      stylesBin: '/styles.js',
      networkingBin: '/net.js',
      spawn: spawn as never,
      logError,
    });

    expect(code).toBe(1);
    expect(logError).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('propaga el exit code de networking', () => {
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 3 });

    const code = runReactGenerate(['-c', 'cfg.json'], {
      stylesBin: '/styles.js',
      networkingBin: '/net.js',
      spawn: spawn as never,
    });

    expect(code).toBe(3);
  });
});
