import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseImageGenerationReturn {
  generateImage: (prompt: string) => Promise<string | null>;
  editImage: (prompt: string, imageUrl: string) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = async (prompt: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-prompt-image', {
        body: { prompt, action: 'generate' }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message);
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: 'Limite atingido',
            description: 'Muitas solicitações. Tente novamente em alguns instantes.',
            variant: 'destructive',
          });
        } else if (data.error.includes('Credits')) {
          toast({
            title: 'Créditos insuficientes',
            description: 'Adicione mais créditos ao seu workspace em Settings → Workspace → Usage.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao gerar imagem',
            description: data.error,
            variant: 'destructive',
          });
        }
        setError(data.error);
        return null;
      }

      if (data?.imageUrl) {
        return data.imageUrl as string;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      console.error('Image generation error:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro ao gerar imagem',
        description: 'Não foi possível gerar a imagem. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const editImage = async (prompt: string, imageUrl: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-prompt-image', {
        body: { prompt, action: 'edit', imageUrl }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message);
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: 'Limite atingido',
            description: 'Muitas solicitações. Tente novamente em alguns instantes.',
            variant: 'destructive',
          });
        } else if (data.error.includes('Credits')) {
          toast({
            title: 'Créditos insuficientes',
            description: 'Adicione mais créditos ao seu workspace em Settings → Workspace → Usage.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao editar imagem',
            description: data.error,
            variant: 'destructive',
          });
        }
        setError(data.error);
        return null;
      }

      if (data?.imageUrl) {
        return data.imageUrl as string;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit image';
      console.error('Image editing error:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro ao editar imagem',
        description: 'Não foi possível editar a imagem. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateImage,
    editImage,
    isLoading,
    error
  };
}