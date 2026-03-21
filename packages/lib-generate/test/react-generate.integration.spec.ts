import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reactGenerateBin = resolve(__dirname, '../dist/bin/react-generate.js');
const stylesDefaults = resolve(__dirname, '../../styles/defaults');

describe('react-generate CLI (integration)', () => {
  it('writes styles.generated.ts, apis.generated.ts, and apis.client.generated.tsx', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'lib-gen-'));
    try {
      const config = {
        libStyles: {
          fromCss: stylesDefaults,
          domainsOrder: ['tokens', 'palette', 'theme'],
          output: './out/styles.generated.ts',
        },
        libNetworking: {
          output: './out/apis.generated.ts',
          apis: {
            integrationtest: { url: 'https://example.com/api' },
          },
        },
      };
      writeFileSync(join(tmp, 'lib.config.json'), JSON.stringify(config, null, 2));

      const r = spawnSync(process.execPath, [reactGenerateBin], {
        cwd: tmp,
        encoding: 'utf-8',
      });

      expect(r.status, r.stderr).toBe(0);
      expect(existsSync(join(tmp, 'out/styles.generated.ts'))).toBe(true);
      expect(existsSync(join(tmp, 'out/apis.generated.ts'))).toBe(true);
      expect(existsSync(join(tmp, 'out/apis.client.generated.tsx'))).toBe(true);
      expect(readFileSync(join(tmp, 'out/apis.generated.ts'), 'utf8')).toContain('integrationtest');
      expect(readFileSync(join(tmp, 'out/apis.client.generated.tsx'), 'utf8')).toContain(
        'useIntegrationtestRequest',
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
