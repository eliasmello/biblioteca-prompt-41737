import { useCallback, useEffect, useRef } from 'react';

interface CacheEntry {
  url: string;
  thumbnailUrl?: string;
  timestamp: number;
}

const CACHE_KEY = 'prompt-image-cache';
const MAX_CACHE_SIZE = 100;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useImageCache = () => {
  const memoryCache = useRef<Map<string, CacheEntry>>(new Map());

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Filter out expired entries
        Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
          if (now - entry.timestamp < CACHE_DURATION) {
            memoryCache.current.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.error('Error loading image cache:', error);
    }
  }, []);

  // Save cache to localStorage
  const persistCache = useCallback(() => {
    try {
      const cacheObj: Record<string, CacheEntry> = {};
      memoryCache.current.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Error persisting image cache:', error);
    }
  }, []);

  const getCachedImage = useCallback((id: string): CacheEntry | null => {
    const entry = memoryCache.current.get(id);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      memoryCache.current.delete(id);
      persistCache();
      return null;
    }

    return entry;
  }, [persistCache]);

  const setCachedImage = useCallback((
    id: string, 
    url: string, 
    thumbnailUrl?: string
  ) => {
    // Enforce cache size limit
    if (memoryCache.current.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = memoryCache.current.keys().next().value;
      if (oldestKey) {
        memoryCache.current.delete(oldestKey);
      }
    }

    const entry: CacheEntry = {
      url,
      thumbnailUrl,
      timestamp: Date.now(),
    };

    memoryCache.current.set(id, entry);
    persistCache();
  }, [persistCache]);

  const preloadImages = useCallback((ids: string[]) => {
    ids.forEach(id => {
      const cached = getCachedImage(id);
      if (cached) {
        // Preload images
        const img = new Image();
        img.src = cached.thumbnailUrl || cached.url;
        if (cached.thumbnailUrl && cached.url) {
          const fullImg = new Image();
          fullImg.src = cached.url;
        }
      }
    });
  }, [getCachedImage]);

  const clearCache = useCallback(() => {
    memoryCache.current.clear();
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const removeCachedImage = useCallback((id: string) => {
    memoryCache.current.delete(id);
    persistCache();
  }, [persistCache]);

  return {
    getCachedImage,
    setCachedImage,
    preloadImages,
    clearCache,
    removeCachedImage,
  };
};
