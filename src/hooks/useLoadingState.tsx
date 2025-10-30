import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar estados de loading de forma centralizada
 * Evita múltiplos estados de loading redundantes e melhora UX
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());

  const startLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingKeys(prev => new Set(prev).add(key));
    }
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        if (next.size === 0) {
          setIsLoading(false);
        }
        return next;
      });
    } else {
      setIsLoading(false);
      setLoadingKeys(new Set());
    }
  }, []);

  const isKeyLoading = useCallback((key: string) => {
    return loadingKeys.has(key);
  }, [loadingKeys]);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>, key?: string): Promise<T> => {
      startLoading(key);
      try {
        return await fn();
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    isKeyLoading,
    withLoading,
  };
};
