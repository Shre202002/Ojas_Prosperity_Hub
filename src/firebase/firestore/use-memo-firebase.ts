'use client';

import { useMemo } from 'react';

/**
 * A specialized memoization hook for Firebase references and queries.
 * Ensures that the DocumentReference or Query instance remains stable
 * between renders unless its actual dependencies change.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
