import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const fetchPrompts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const pageSize = 50;
      let from = 0;
      let allRows: any[] = [];
      // Busca paginada para evitar timeouts e payloads gigantes (preview_image pode ser grande)
      while (true) {
        const { data: rows, error } = await supabase
          .from('prompts')
          .select(`
            id, title, category, subcategory, content, description, number,
            tags, keywords, style_tags, subject_tags, created_by, updated_by,
            is_favorite, usage_count, created_at, updated_at, preview_image
          `)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          toast({
            title: "Erro ao carregar prompts",
            description: error.message,
            variant: "destructive"
          });
          break;
        }

        const batch = rows || [];
        allRows = allRows.concat(batch);

        // Se retornou menos que o pageSize, não há mais páginas
        if (batch.length < pageSize) break;

        from += pageSize;
      }

      // Mapear campos do banco para o frontend
      const mappedPrompts = allRows.map((prompt: any) => ({
        ...prompt,
        styleTags: prompt.style_tags || [],
        subjectTags: prompt.subject_tags || [],
        createdBy: prompt.created_by,
        updatedBy: prompt.updated_by,
        isFavorite: prompt.is_favorite,
        usageCount: prompt.usage_count,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at,
        previewImage: prompt.preview_image || null
      }));

      setPrompts(mappedPrompts);
    } catch (err) {
      console.error('Erro ao buscar prompts:', err);
      toast({
        title: "Erro ao carregar prompts",
        description: "Falha na conexão com o banco de dados",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [user, toast]);

  const createPrompt = useCallback(async (promptData: Partial<Prompt>) => {
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
      preview_image: promptData.previewImage,
      created_by: user.id,
      is_favorite: false,
      usage_count: 0
    };
    
    const { data, error } = await supabase
      .from('prompts')
      .insert([dbPrompt])
      .select(`
        id, title, category, subcategory, content, description, number,
        tags, keywords, style_tags, subject_tags, created_by, updated_by,
        is_favorite, usage_count, created_at, updated_at, preview_image
      `)
      .single();

    if (error) {
      toast({
        title: "Erro ao criar prompt",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } else {
      const mappedData = {
        ...data,
        styleTags: data.style_tags || [],
        subjectTags: data.subject_tags || [],
        createdBy: data.created_by,
        updatedBy: data.updated_by,
        isFavorite: data.is_favorite,
        usageCount: data.usage_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        previewImage: data.preview_image
      };
      
      setPrompts(prev => [mappedData, ...prev]);
      
      toast({
        title: "Prompt criado!",
        description: "Prompt adicionado com sucesso."
      });
      return { data: mappedData };
    }
  }, [user, toast]);

  const updatePrompt = useCallback(async (id: string, promptData: Partial<Prompt>) => {
    if (!user) return { error: 'User not authenticated' };

    const dbUpdates: any = {};
    
    if (promptData.title !== undefined) dbUpdates.title = promptData.title;
    if (promptData.category !== undefined) dbUpdates.category = promptData.category;
    if (promptData.subcategory !== undefined) dbUpdates.subcategory = promptData.subcategory;
    if (promptData.content !== undefined) dbUpdates.content = promptData.content;
    if (promptData.description !== undefined) dbUpdates.description = promptData.description;
    if (promptData.number !== undefined) dbUpdates.number = promptData.number;
    if (promptData.isFavorite !== undefined) dbUpdates.is_favorite = promptData.isFavorite;
    if (promptData.usageCount !== undefined) dbUpdates.usage_count = promptData.usageCount;
    if (promptData.previewImage !== undefined) dbUpdates.preview_image = promptData.previewImage;
    
    dbUpdates.updated_by = user.id;
    
    const { data, error } = await supabase
      .from('prompts')
      .update(dbUpdates)
      .eq('id', id)
      .select(`
        id, title, category, subcategory, content, description, number,
        tags, keywords, style_tags, subject_tags, created_by, updated_by,
        is_favorite, usage_count, created_at, updated_at, preview_image
      `)
      .single();

    if (error) {
      toast({
        title: "Erro ao atualizar prompt",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } else {
      const mappedData = {
        ...data,
        styleTags: data.style_tags || [],
        subjectTags: data.subject_tags || [],
        createdBy: data.created_by,
        updatedBy: data.updated_by,
        isFavorite: data.is_favorite,
        usageCount: data.usage_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        previewImage: data.preview_image
      };
      
      setPrompts(prev => prev.map(p => p.id === id ? mappedData : p));
      
      toast({
        title: "Prompt atualizado!",
        description: "Prompt modificado com sucesso."
      });
      return { data: mappedData };
    }
  }, [user, toast]);

  const deletePrompt = useCallback(async (id: string) => {
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
      setPrompts(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Prompt deletado!",
        description: "Prompt removido com sucesso."
      });
      return { success: true };
    }
  }, [user, toast]);

  const importPrompts = useCallback(async (content: string) => {
    if (!user) return { error: 'User not authenticated' };

    const promptsToImport: Partial<Prompt>[] = [];

    const createPromptObject = (promptContent: string, index: number) => {
      const parsed = parsePromptContent(promptContent);
      return {
        title: parsed.category 
          ? `${parsed.category}${parsed.number ? ` #${parsed.number}` : ` #${index + 1}`}`
          : `Prompt #${index + 1}`,
        category: parsed.category || 'Geral',
        subcategory: parsed.subcategory,
        content: promptContent.trim(),
        tags: [...(parsed.extractedTags?.style || []), ...(parsed.extractedTags?.subject || [])],
        keywords: [],
        styleTags: parsed.extractedTags?.style || [],
        subjectTags: parsed.extractedTags?.subject || [],
        number: parsed.number
      };
    };

    const separationStrategies = [
      {
        name: 'numbered',
        pattern: /(?:^|\n)(?:\d+\.?\s*(?:Prompt:?\s*)?)/gm,
        split: (content: string) => {
          const parts = content.split(/(?:^|\n)(?:\d+\.?\s*(?:Prompt:?\s*)?)/gm);
          return parts.filter(part => part.trim().length > 20);
        }
      },
      {
        name: 'headers',
        pattern: /(?:^|\n)#{1,6}\s+/gm,
        split: (content: string) => {
          const parts = content.split(/(?:^|\n)#{1,6}\s+/gm);
          return parts.filter(part => part.trim().length > 20);
        }
      },
      {
        name: 'categories',
        pattern: /\*\*\[.*?\]\*\*/gm,
        split: (content: string) => {
          const parts = content.split(/(?=\*\*\[.*?\]\*\*)/gm);
          return parts.filter(part => part.trim().length > 20);
        }
      },
      {
        name: 'paragraphs',
        pattern: /\n\s*\n/gm,
        split: (content: string) => {
          const parts = content.split(/\n\s*\n/gm);
          return parts.filter(part => part.trim().length > 50);
        }
      },
      {
        name: 'keywords',
        pattern: /(?:^|\n)(?:prompt|scene|description|image|photo|picture|design)[:.]?\s*/gmi,
        split: (content: string) => {
          const parts = content.split(/(?:^|\n)(?:prompt|scene|description|image|photo|picture|design)[:.]?\s*/gmi);
          return parts.filter(part => part.trim().length > 20);
        }
      }
    ];

    let bestStrategy: any = null;
    let maxPrompts = 0;

    for (const strategy of separationStrategies) {
      const parts = strategy.split(content);
      if (parts.length > maxPrompts && parts.length > 1) {
        maxPrompts = parts.length;
        bestStrategy = strategy;
      }
    }

    if (bestStrategy && maxPrompts > 1) {
      console.log(`Using strategy: ${bestStrategy.name}, found ${maxPrompts} prompts`);
      const parts = bestStrategy.split(content);
      
      parts.forEach((part: string, index: number) => {
        if (part.trim().length > 20) {
          promptsToImport.push(createPromptObject(part, index));
        }
      });
    } else {
      console.log('No clear separation found, treating as single prompt');
      promptsToImport.push(createPromptObject(content, 0));
    }

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
      .select(`
        id, title, category, subcategory, content, description, number,
        tags, keywords, style_tags, subject_tags, created_by, updated_by,
        is_favorite, usage_count, created_at, updated_at, preview_image
      `);

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
  }, [user, toast, fetchPrompts]);

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user, fetchPrompts]);

  const value = useMemo(() => ({
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    importPrompts,
    refetch: fetchPrompts
  }), [prompts, loading, createPrompt, updatePrompt, deletePrompt, importPrompts, fetchPrompts]);

  return value;
};
