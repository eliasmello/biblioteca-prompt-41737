import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Prompt } from '@/types/prompt';
import * as promptService from '@/services/promptService';
import { useLoadingState } from './useLoadingState';

/**
 * Hook for managing prompts with clean separation of concerns
 */
export const usePrompts = () => {
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([]);
  const [personalPrompts, setPersonalPrompts] = useState<Prompt[]>([]);
  const [personalCursor, setPersonalCursor] = useState<string | null>(null);
  const [publicCursor, setPublicCursor] = useState<string | null>(null);
  const [hasMorePersonal, setHasMorePersonal] = useState(false);
  const [hasMorePublic, setHasMorePublic] = useState(false);
  const [loadingMorePersonal, setLoadingMorePersonal] = useState(false);
  const [loadingMorePublic, setLoadingMorePublic] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isLoading: loading, withLoading, isKeyLoading } = useLoadingState(false);

  const loadInitial = useCallback(async () => {
    if (!user) return;

    await withLoading(async () => {
      try {
        // Reset state
        setPersonalPrompts([]);
        setPublicPrompts([]);
        setPersonalCursor(null);
        setPublicCursor(null);

        // Load first page of personal prompts
        const personalResult = await promptService.fetchPromptsPage({
          personalOnly: true,
          userId: user.id,
          limit: 20,
        });
        setPersonalPrompts(personalResult.items);
        setPersonalCursor(personalResult.nextCursor);
        setHasMorePersonal(!!personalResult.nextCursor);

        // Load first page of public prompts
        const publicResult = await promptService.fetchPromptsPage({
          personalOnly: false,
          userId: user.id,
          limit: 20,
        });
        setPublicPrompts(publicResult.items);
        setPublicCursor(publicResult.nextCursor);
        setHasMorePublic(!!publicResult.nextCursor);
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar prompts',
          description: error.message,
          variant: 'destructive',
        });
      }
    }, 'load-initial');
  }, [user, toast, withLoading]);

  const loadMore = useCallback(async (personalOnly: boolean) => {
    if (!user) return;

    const cursor = personalOnly ? personalCursor : publicCursor;
    if (!cursor) return;

    const setLoadingMore = personalOnly ? setLoadingMorePersonal : setLoadingMorePublic;
    setLoadingMore(true);

    try {
      const result = await promptService.fetchPromptsPage({
        personalOnly,
        userId: user.id,
        limit: 20,
        cursorCreatedAt: cursor,
      });

      if (personalOnly) {
        setPersonalPrompts(prev => [...prev, ...result.items]);
        setPersonalCursor(result.nextCursor);
        setHasMorePersonal(!!result.nextCursor);
      } else {
        setPublicPrompts(prev => [...prev, ...result.items]);
        setPublicCursor(result.nextCursor);
        setHasMorePublic(!!result.nextCursor);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mais prompts',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  }, [user, personalCursor, publicCursor, toast]);

  const fetchPrompts = useCallback(
    async (personalOnly = false) => {
      // Deprecated - use loadInitial instead
      await loadInitial();
    },
    [loadInitial]
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


  const value = useMemo(
    () => ({
      prompts: publicPrompts,
      personalPrompts,
      publicPrompts,
      loading,
      loadingMorePersonal,
      loadingMorePublic,
      hasMorePersonal,
      hasMorePublic,
      createPrompt,
      updatePrompt,
      deletePrompt,
      importPrompts,
      refetch: fetchPrompts,
      loadInitial,
      loadMore,
      fetchPreviewImage,
      getPromptById,
      setPersonalPrompts,
      setPublicPrompts,
    }),
    [
      publicPrompts,
      personalPrompts,
      loading,
      loadingMorePersonal,
      loadingMorePublic,
      hasMorePersonal,
      hasMorePublic,
      createPrompt,
      updatePrompt,
      deletePrompt,
      importPrompts,
      fetchPrompts,
      loadInitial,
      loadMore,
      fetchPreviewImage,
      getPromptById,
    ]
  );

  return value;
};
