import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Prompt } from '@/types/prompt';
import { parsePromptContent } from '@/lib/prompt-parser';

export const usePrompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPrompts = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar prompts",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Map database fields to frontend fields
      const mappedPrompts = (data || []).map(prompt => ({
        ...prompt,
        styleTags: prompt.style_tags || [],
        subjectTags: prompt.subject_tags || [],
        createdBy: prompt.created_by,
        updatedBy: prompt.updated_by,
        isFavorite: prompt.is_favorite,
        usageCount: prompt.usage_count,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at
      }));
      setPrompts(mappedPrompts);
    }
    setLoading(false);
  };

  const createPrompt = async (promptData: Partial<Prompt>) => {
    if (!user) return { error: 'User not authenticated' };

    const parsed = parsePromptContent(promptData.content || '');
    
    const dbPrompt = {
      title: promptData.title || 'Untitled',
      category: parsed.category || promptData.category,
      subcategory: parsed.subcategory || promptData.subcategory,
      content: promptData.content || '',
      description: promptData.description,
      number: parsed.number || promptData.number,
      tags: [...(parsed.extractedTags?.style || []), ...(parsed.extractedTags?.subject || [])],
      keywords: [],
      style_tags: parsed.extractedTags?.style || [],
      subject_tags: parsed.extractedTags?.subject || [],
      created_by: user.id,
      is_favorite: false,
      usage_count: 0
    };
    
    const { data, error } = await supabase
      .from('prompts')
      .insert([dbPrompt])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar prompt",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } else {
      toast({
        title: "Prompt criado!",
        description: "Prompt adicionado com sucesso."
      });
      await fetchPrompts();
      return { data };
    }
  };

  const updatePrompt = async (id: string, promptData: Partial<Prompt>) => {
    if (!user) return { error: 'User not authenticated' };

    // Map frontend fields to database fields
    const dbUpdates: any = {};
    
    if (promptData.title !== undefined) dbUpdates.title = promptData.title;
    if (promptData.category !== undefined) dbUpdates.category = promptData.category;
    if (promptData.subcategory !== undefined) dbUpdates.subcategory = promptData.subcategory;
    if (promptData.content !== undefined) dbUpdates.content = promptData.content;
    if (promptData.description !== undefined) dbUpdates.description = promptData.description;
    if (promptData.number !== undefined) dbUpdates.number = promptData.number;
    if (promptData.isFavorite !== undefined) dbUpdates.is_favorite = promptData.isFavorite;
    if (promptData.usageCount !== undefined) dbUpdates.usage_count = promptData.usageCount;
    
    // Always update the updated_by field
    dbUpdates.updated_by = user.id;
    
    const { data, error } = await supabase
      .from('prompts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao atualizar prompt",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } else {
      toast({
        title: "Prompt atualizado!",
        description: "Prompt modificado com sucesso."
      });
      await fetchPrompts();
      return { data };
    }
  };

  const deletePrompt = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao deletar prompt",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } else {
      toast({
        title: "Prompt deletado!",
        description: "Prompt removido com sucesso."
      });
      await fetchPrompts();
      return { success: true };
    }
  };

  const importPrompts = async (content: string) => {
    if (!user) return { error: 'User not authenticated' };

    const lines = content.split('\n').filter(line => line.trim());
    const promptsToImport: Partial<Prompt>[] = [];

    let currentPrompt = '';
    for (const line of lines) {
      if (line.includes('**[') && line.includes(']**') && currentPrompt) {
        const parsed = parsePromptContent(currentPrompt);
        promptsToImport.push({
          ...parsed,
          content: currentPrompt
        });
        currentPrompt = line;
      } else {
        currentPrompt += (currentPrompt ? '\n' : '') + line;
      }
    }

    // Process last prompt
    if (currentPrompt) {
      const parsed = parsePromptContent(currentPrompt);
      promptsToImport.push({
        ...parsed,
        content: currentPrompt
      });
    }

    // Map to database format
    const dbPrompts = promptsToImport.map(prompt => ({
      title: prompt.title || 'Untitled',
      category: prompt.category,
      subcategory: prompt.subcategory,
      content: prompt.content || '',
      description: prompt.description,
      number: prompt.number,
      tags: prompt.tags || [],
      keywords: prompt.keywords || [],
      style_tags: prompt.styleTags || [],
      subject_tags: prompt.subjectTags || [],
      created_by: user.id,
      is_favorite: false,
      usage_count: 0
    }));

    const { data, error } = await supabase
      .from('prompts')
      .insert(dbPrompts)
      .select();

    if (error) {
      toast({
        title: "Erro ao importar prompts",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } else {
      toast({
        title: "Prompts importados!",
        description: `${data?.length || 0} prompts importados com sucesso.`
      });
      await fetchPrompts();
      return { data };
    }
  };

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  return {
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    importPrompts,
    refetch: fetchPrompts
  };
};