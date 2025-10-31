import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string | null | undefined;
  fullSrc?: string | null | undefined;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  cached?: boolean;
  fallback?: string;
}

export const LazyImage = ({
  src,
  fullSrc,
  alt,
  className,
  onLoad,
  onError,
  cached = false,
  fallback = '/placeholder.svg',
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    // Start with thumbnail or full source
    const imageSrc = src;
    setCurrentSrc(imageSrc);

    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();

      // If we have a full source and loaded thumbnail, load full image
      if (fullSrc && fullSrc !== src) {
        const fullImg = new Image();
        fullImg.src = fullSrc;
        fullImg.onload = () => {
          setCurrentSrc(fullSrc);
        };
      }
    };

    img.onerror = () => {
      setHasError(true);
      setCurrentSrc(fallback);
      onError?.();
    };
  }, [isInView, src, fullSrc, onLoad, onError, fallback]);

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
    >
      {!isInView || !currentSrc ? (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
        />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-xs">Sem imagem</span>
        </div>
      )}
    </div>
  );
};
