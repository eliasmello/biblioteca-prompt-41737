import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Prompt } from '@/types/prompt';
import * as promptService from '@/services/promptService';

/**
 * Optimized hook for managing prompts with better separation of concerns
 */
export const useOptimizedPrompts = () => {
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([]);
  const [personalPrompts, setPersonalPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const isFetchingRef = useRef(false);

  const fetchPrompts = useCallback(
    async (personalOnly = false) => {
      if (!user || isFetchingRef.current) return;

      isFetchingRef.current = true;
      setLoading(true);

      try {
        const prompts = await promptService.fetchPrompts({
          personalOnly,
          userId: user.id,
        });

        if (personalOnly) {
          setPersonalPrompts(prompts);
        } else {
          setPublicPrompts(prompts);
        }
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar prompts',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [user, toast]
  );

  const createPrompt = useCallback(
    async (promptData: promptService.CreatePromptData) => {
      if (!user) return { error: 'User not authenticated' };

      try {
        const newPrompt = await promptService.createPrompt(promptData, user.id);

        if (promptData.isPublic) {
          setPublicPrompts(prev => [newPrompt, ...prev]);
        } else {
          setPersonalPrompts(prev => [newPrompt, ...prev]);
        }

        toast({
          title: 'Prompt criado!',
          description: 'Prompt adicionado com sucesso.',
        });

        return { data: newPrompt };
      } catch (error: any) {
        toast({
          title: 'Erro ao criar prompt',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
    },
    [user, toast]
  );

  const updatePrompt = useCallback(
    async (
      id: string,
      promptData: promptService.UpdatePromptData,
      options?: { silent?: boolean }
    ) => {
      if (!user) return { error: 'User not authenticated' };

      try {
        const updated = await promptService.updatePrompt(id, promptData, user.id);

        setPublicPrompts(prev => prev.map(p => (p.id === id ? updated : p)));
        setPersonalPrompts(prev => prev.map(p => (p.id === id ? updated : p)));

        if (!options?.silent) {
          toast({
            title: 'Prompt atualizado!',
            description: 'Prompt modificado com sucesso.',
          });
        }

        return { data: updated };
      } catch (error: any) {
        toast({
          title: 'Erro ao atualizar prompt',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
    },
    [user, toast]
  );

  const deletePrompt = useCallback(
    async (id: string) => {
      if (!user) return { error: 'User not authenticated' };

      try {
        await promptService.deletePrompt(id);

        setPublicPrompts(prev => prev.filter(p => p.id !== id));
        setPersonalPrompts(prev => prev.filter(p => p.id !== id));

        toast({
          title: 'Prompt deletado!',
          description: 'Prompt removido com sucesso.',
        });

        return { success: true };
      } catch (error: any) {
        toast({
          title: 'Erro ao deletar prompt',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
    },
    [user, toast]
  );

  const importPrompts = useCallback(
    async (content: string) => {
      if (!user) return { error: 'User not authenticated' };

      try {
        const imported = await promptService.importPrompts(content, user.id);

        setPersonalPrompts(prev => [...imported, ...prev]);

        toast({
          title: 'Prompts importados!',
          description: `${imported.length} prompts importados com sucesso.`,
        });

        return { data: imported };
      } catch (error: any) {
        toast({
          title: 'Erro ao importar prompts',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
    },
    [user, toast]
  );

  const fetchPreviewImage = useCallback(async (id: string) => {
    try {
      const previewImage = await promptService.fetchPreviewImage(id);

      setPublicPrompts(prev =>
        prev.map(p => (p.id === id ? { ...p, previewImage } : p))
      );
      setPersonalPrompts(prev =>
        prev.map(p => (p.id === id ? { ...p, previewImage } : p))
      );
    } catch (error) {
      console.warn('Falha ao carregar preview_image:', error);
    }
  }, []);

  const getPromptById = useCallback(async (id: string): Promise<Prompt | undefined> => {
    try {
      const prompt = await promptService.getPromptById(id);
      return prompt || undefined;
    } catch (error) {
      console.error('Erro ao buscar prompt por ID:', error);
      return undefined;
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (user) {
      fetchPrompts(true); // Personal prompts
      fetchPrompts(false); // Public prompts
    }
  }, [user, fetchPrompts]);

  const value = useMemo(
    () => ({
      prompts: publicPrompts,
      personalPrompts,
      publicPrompts,
      loading,
      createPrompt,
      updatePrompt,
      deletePrompt,
      importPrompts,
      refetch: fetchPrompts,
      fetchPreviewImage,
      getPromptById,
    }),
    [
      publicPrompts,
      personalPrompts,
      loading,
      createPrompt,
      updatePrompt,
      deletePrompt,
      importPrompts,
      fetchPrompts,
      fetchPreviewImage,
      getPromptById,
    ]
  );

  return value;
};
