'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

/**
 * A global listener for Firebase-related errors.
 * It catches specialized FirestorePermissionErrors emitted by hooks
 * and displays them via the toast system for development debugging.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error('Firebase Permission Error caught by listener:', error);
      
      toast({
        variant: 'destructive',
        title: 'Database Permission Error',
        description: `Operation "${error.context.operation}" failed at path: ${error.context.path}. Check your Security Rules.`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
