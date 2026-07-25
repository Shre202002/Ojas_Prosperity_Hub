'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useCollection<T = any>(query: Query | null, path?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T)));
        setLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: path ?? 'unknown-collection',
          operation: 'list',
        });
        console.error('[useCollection] Permission denied:', {
          path,
          code: err.code,
          message: err.message,
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [query, path]);

  return { data, loading, error };
}