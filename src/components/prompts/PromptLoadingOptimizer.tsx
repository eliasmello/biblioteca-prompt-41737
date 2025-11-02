import { useEffect } from 'react';

interface PromptLoadingOptimizerProps {
  onPreload: () => void;
}

export function PromptLoadingOptimizer({ onPreload }: PromptLoadingOptimizerProps) {
  useEffect(() => {
    // Preload imediato após o componente montar
    const timer = setTimeout(onPreload, 0);
    return () => clearTimeout(timer);
  }, [onPreload]);

  return null;
}