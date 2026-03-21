'use client';

import { useEffect, useRef } from 'react';

/** Keeps a ref to the latest value — useful for stable callbacks in effects. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
