import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { z } from 'zod';

import { useMakeZodValidators } from '../src/components/organisms/form/use-form-zod';

describe('useMakeZodValidators', () => {
  const schema = z.object({
    title: z.string().min(1, 'min'),
  });

  it('memoizes validators for stable schema/messages/encode', () => {
    const messages = { title: 'Required' };
    const { result, rerender } = renderHook(() =>
      useMakeZodValidators({ schema, messages }),
    );
    const first = result.current;
    rerender();
    expect(result.current.title).toBe(first.title);
  });

  it('recomputes when deps change', () => {
    const messages = { title: 'Required' };
    let locale = 'en';
    const { result, rerender } = renderHook(() =>
      useMakeZodValidators({ schema, messages }, [locale]),
    );
    const first = result.current.title;
    locale = 'es';
    act(() => {
      rerender();
    });
    expect(result.current.title).not.toBe(first);
  });
});
