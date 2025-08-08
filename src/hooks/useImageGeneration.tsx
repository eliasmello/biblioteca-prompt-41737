import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseImageGenerationReturn {
  generateImage: (prompt: string) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (prompt: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const requestPromise = supabase.functions.invoke('generate-prompt-image', {
        body: { prompt }
      });

      const { data, error: functionError } = await Promise.race([
        requestPromise,
        timeoutPromise
      ]) as any;

      if (functionError) {
        // Silently fail for API key errors to avoid console spam
        if (functionError.message?.includes('OPENAI_API_KEY')) {
          return null;
        }
        console.error('Function error:', functionError);
        throw new Error(functionError.message);
      }

      if (data?.imageUrl) {
        return `data:image/webp;base64,${data.imageUrl}`;
      }

      return null;
    } catch (err) {
      // Silently fail for API key errors to avoid console spam
      if (err instanceof Error && err.message?.includes('OPENAI_API_KEY')) {
        return null;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      console.error('Image generation error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateImage,
    isLoading,
    error
  };
}