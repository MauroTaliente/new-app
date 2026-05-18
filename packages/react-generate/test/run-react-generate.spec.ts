import { describe, expect, it, vi } from 'vitest';
import { runReactGenerate, REACT_GENERATE_HELP } from '../src/run-react-generate.js';

const bins = {
  stylesBin: '/pkg/styles/bin/generate-tokens.js',
  networkingBin: '/pkg/net/bin/generate-apis.js',
  i18nBin: '/pkg/i18n/bin/generate-locales.js',
  themeBin: '/pkg/theme/bin/generate-theme-runtime.js',
};

describe('runReactGenerate', () => {
  it('imprime help y retorna 0', () => {
    const log = vi.fn();
    const spawn = vi.fn();

    const code = runReactGenerate(['--help'], {
      ...bins,
      spawn: spawn as never,
      log,
    });

    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith(REACT_GENERATE_HELP);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('corre styles, networking, i18n y theme', () => {
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 });

    const code = runReactGenerate(
      ['--config', './react33.config.json', '--domains', 'tokens', '-o', './out/api.ts'],
      {
        ...bins,
        execPath: '/usr/bin/node',
        cwd: '/app',
        spawn: spawn as never,
      },
    );

    expect(code).toBe(0);
    expect(spawn).toHaveBeenCalledTimes(4);
    expect(spawn.mock.calls[3]).toEqual([
      '/usr/bin/node',
      ['/pkg/theme/bin/generate-theme-runtime.js', '--config', './react33.config.json'],
      { stdio: 'inherit', cwd: '/app' },
    ]);
  });

  it('no ejecuta networking ni i18n si styles falla', () => {
    const spawn = vi.fn().mockReturnValueOnce({ status: 2 });

    const code = runReactGenerate(['--config', 'x.json'], {
      ...bins,
      spawn: spawn as never,
    });

    expect(code).toBe(2);
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta i18n ni theme si networking falla', () => {
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 4 });

    const code = runReactGenerate(['--config', 'x.json'], {
      ...bins,
      spawn: spawn as never,
    });

    expect(code).toBe(4);
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('no ejecuta theme si i18n falla', () => {
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 5 });

    const code = runReactGenerate(['--config', 'x.json'], {
      ...bins,
      spawn: spawn as never,
    });

    expect(code).toBe(5);
    expect(spawn).toHaveBeenCalledTimes(3);
  });

  it('retorna 1 si theme reporta error de spawn', () => {
    const logError = vi.fn();
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0, error: new Error('ENOENT') });

    const code = runReactGenerate([], {
      ...bins,
      spawn: spawn as never,
      logError,
    });

    expect(code).toBe(1);
    expect(logError).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(4);
  });

  it('propaga el exit code de theme', () => {
    const spawn = vi
      .fn()
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 3 });

    const code = runReactGenerate(['-c', 'cfg.json'], {
      ...bins,
      spawn: spawn as never,
    });

    expect(code).toBe(3);
  });
});
