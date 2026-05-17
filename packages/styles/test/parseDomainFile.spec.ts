import { describe, it, expect } from 'vitest';
import { parseSingleDomainCss } from '../src/css/parseDomainFile.js';

describe('parseSingleDomainCss', () => {
  it('parses @theme and :root custom properties into a nested tree', () => {
    const tree = parseSingleDomainCss(`
      @theme {
        --color-bg-100: #111111;
      }
      :root {
        --spacing-md: 1rem;
      }
    `);

    expect(tree).toMatchObject({
      color: { 'bg-100': '#111111' },
      spacing: { md: '1rem' },
    });
  });

  it('returns light and dark buckets when mode selectors are present', () => {
    const tree = parseSingleDomainCss(`
      .light {
        --color-bg-100: #fff;
      }
      .dark {
        --color-bg-100: #000;
      }
    `);

    expect(tree).toMatchObject({
      light: { color: { 'bg-100': '#fff' } },
      dark: { color: { 'bg-100': '#000' } },
    });
  });
});
