import { supabase } from '@/integrations/supabase/client';
import { Prompt } from '@/types/prompt';
import { parsePromptContent } from '@/lib/prompt-parser';
import { logger } from '@/lib/logger';

const PAGE_SIZE = 50;

// Colunas para listagem (incluindo content)
const SELECT_SUMMARY = `
  id, title, category, subcategory, content, description, number,
  created_by, updated_by, is_favorite, usage_count,
  created_at, updated_at, is_public, preview_image, thumbnail_url
`;
// Colunas completas para detalhes
const SELECT_FULL = `
  id, title, category, subcategory, content, description, number,
  tags, keywords, style_tags, subject_tags, created_by, updated_by,
  is_favorite, usage_count, created_at, updated_at, is_public,
  preview_image, thumbnail_url
`;

export interface FetchPromptsOptions {
  personalOnly?: boolean;
  userId?: string;
  limit?: number;
  cursorCreatedAt?: string;
}

export interface FetchPromptsPageResult {
  items: Prompt[];
  nextCursor: string | null;
}

export interface CreatePromptData {
  title?: string;
  category?: string;
  subcategory?: string;
  content: string;
  description?: string;
  number?: number;
  previewImage?: string | null;
  isPublic?: boolean;
}

export interface UpdatePromptData {
  title?: string;
  category?: string;
  subcategory?: string;
  content?: string;
  description?: string;
  number?: number;
  isFavorite?: boolean;
  usageCount?: number;
  previewImage?: string | null;
  thumbnailUrl?: string | null;
  isPublic?: boolean;
  tags?: string[];
  keywords?: string[];
  styleTags?: string[];
  subjectTags?: string[];
}

/**
 * Maps database prompt to application Prompt type
 */
export function mapDbPromptToPrompt(dbPrompt: any): Prompt {
  return {
    ...dbPrompt,
    // Garantir que campos opcionais nunca sejam undefined
    content: dbPrompt.content || '',
    tags: dbPrompt.tags || [],
    keywords: dbPrompt.keywords || [],
    styleTags: dbPrompt.style_tags || [],
    subjectTags: dbPrompt.subject_tags || [],
    createdBy: dbPrompt.created_by,
    updatedBy: dbPrompt.updated_by,
    isFavorite: dbPrompt.is_favorite,
    usageCount: dbPrompt.usage_count,
    createdAt: dbPrompt.created_at,
    updatedAt: dbPrompt.updated_at,
    previewImage: dbPrompt.preview_image ?? null,
    thumbnailUrl: dbPrompt.thumbnail_url ?? null,
  };
}

/**
 * Fetches a single page of prompts using keyset pagination
 */
export async function fetchPromptsPage(options: FetchPromptsOptions = {}): Promise<FetchPromptsPageResult> {
  const { personalOnly = false, userId, limit = 20, cursorCreatedAt } = options;
  
  if (!userId) {
    throw new Error('User ID is required to fetch prompts');
  }

  let pageSize = limit;
  let retryCount = 0;

  while (retryCount < 2) {
    try {
      let query = supabase
        .from('prompts')
        .select(SELECT_SUMMARY)
        .order('created_at', { ascending: false })
        .limit(pageSize);

      if (personalOnly) {
        query = query.eq('created_by', userId);
      } else {
        query = query.eq('is_public', true);
      }

      // Apply cursor for pagination
      if (cursorCreatedAt) {
        query = query.lt('created_at', cursorCreatedAt);
      }

      const { data, error } = await query;

      if (error) {
        if (isTimeoutError(error) && retryCount < 1) {
          retryCount++;
          pageSize = Math.floor(pageSize / 2);
          logger.warn(`Timeout na página, reduzindo para ${pageSize} itens`);
          continue;
        }
        throw error;
      }

      const items = (data || []).map(mapDbPromptToPrompt);
      const nextCursor = items.length === pageSize && items.length > 0
        ? items[items.length - 1].createdAt
        : null;

      return { items, nextCursor };
    } catch (err: any) {
      if (isTimeoutError(err) && retryCount < 1) {
        retryCount++;
        pageSize = Math.floor(pageSize / 2);
        logger.warn(`Erro de timeout, tentando com ${pageSize} itens`);
        continue;
      }
      throw new Error('Tempo limite excedido ao carregar prompts. Tente novamente.');
    }
  }

  return { items: [], nextCursor: null };
}

/**
 * Fetches prompts from the database with pagination and retry logic
 * @deprecated Use fetchPromptsPage for better performance
 */
export async function fetchPrompts(options: FetchPromptsOptions = {}): Promise<Prompt[]> {
  const { personalOnly = false, userId } = options;
  
  if (!userId) {
    throw new Error('User ID is required to fetch prompts');
  }

  const startTime = performance.now();
  const allPrompts: Prompt[] = [];
  const seen = new Set<string>();
  let pageSize = PAGE_SIZE;
  let retryCount = 0;

  // Primeira tentativa: buscar total para decidir estratégia
  let query = supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true });

  if (personalOnly) {
    query = query.eq('created_by', userId);
  } else {
    query = query.eq('is_public', true);
  }

  const { count } = await query;
  const totalCount = count || 0;

  logger.debug(`fetchPrompts(${personalOnly ? 'personal' : 'public'}): total=${totalCount}`);

  // Se total <= PAGE_SIZE, buscar tudo de uma vez
  if (totalCount <= PAGE_SIZE) {
    try {
      let singleQuery = supabase
        .from('prompts')
        .select(SELECT_SUMMARY)
        .order('created_at', { ascending: false });

      if (personalOnly) {
        singleQuery = singleQuery.eq('created_by', userId);
      } else {
        singleQuery = singleQuery.eq('is_public', true);
      }

      const { data, error } = await singleQuery;

      if (error) {
        if (isTimeoutError(error)) {
          logger.warn('Timeout na busca única, tentando com lote menor');
          pageSize = Math.floor(PAGE_SIZE / 2);
        } else {
          throw error;
        }
      } else {
        const duration = performance.now() - startTime;
        logger.debug(`fetchPrompts completou em ${duration.toFixed(0)}ms`);
        return (data || []).map(mapDbPromptToPrompt);
      }
    } catch (err) {
      logger.error('Erro na busca única:', err);
      pageSize = Math.floor(PAGE_SIZE / 2);
    }
  }

  // Paginação com retry
  let from = 0;
  while (true) {
    try {
      let paginatedQuery = supabase
        .from('prompts')
        .select(SELECT_SUMMARY)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (personalOnly) {
        paginatedQuery = paginatedQuery.eq('created_by', userId);
      } else {
        paginatedQuery = paginatedQuery.eq('is_public', true);
      }

      const { data, error } = await paginatedQuery;

      if (error) {
        if (isTimeoutError(error) && retryCount < 1) {
          retryCount++;
          pageSize = Math.floor(pageSize / 2);
          logger.warn(`Timeout detectado, reduzindo pageSize para ${pageSize}`);
          continue;
        }
        throw error;
      }

      if (!data || data.length === 0) break;

      const mapped = data.map(mapDbPromptToPrompt);
      
      for (const prompt of mapped) {
        if (!seen.has(prompt.id)) {
          seen.add(prompt.id);
          allPrompts.push(prompt);
        }
      }

      if (data.length < pageSize) break;
      from += pageSize;
    } catch (err: any) {
      if (isTimeoutError(err) && retryCount < 1) {
        retryCount++;
        pageSize = Math.floor(pageSize / 2);
        logger.warn(`Erro de timeout, tentando novamente com pageSize=${pageSize}`);
        continue;
      }
      throw new Error('A busca levou mais tempo que o esperado. Tentamos novamente com um lote menor, mas não foi possível completar.');
    }
  }

  const duration = performance.now() - startTime;
  logger.debug(`fetchPrompts completou em ${duration.toFixed(0)}ms com ${allPrompts.length} prompts`);

  return allPrompts;
}

/**
 * Verifica se é um erro de timeout do Postgres
 */
function isTimeoutError(error: any): boolean {
  return (
    error?.code === '57014' ||
    error?.message?.toLowerCase().includes('statement timeout') ||
    error?.message?.toLowerCase().includes('canceling statement')
  );
}

/**
 * Creates a new prompt in the database
 */
export async function createPrompt(
  data: CreatePromptData,
  userId: string
): Promise<Prompt> {
  const parsed = parsePromptContent(data.content);

  const dbPrompt = {
    title: data.title || 'Untitled',
    category: parsed.category || data.category || 'Geral',
    subcategory: parsed.subcategory || data.subcategory,
    content: data.content,
    description: data.description,
    number: parsed.number || data.number,
    tags: [...(parsed.extractedTags?.style || []), ...(parsed.extractedTags?.subject || [])],
    keywords: [],
    style_tags: parsed.extractedTags?.style || [],
    subject_tags: parsed.extractedTags?.subject || [],
    preview_image: data.previewImage,
    created_by: userId,
    updated_by: userId,
    is_favorite: false,
    usage_count: 0,
    is_public: data.isPublic || false,
  };

  const { data: result, error } = await supabase
    .from('prompts')
    .insert([dbPrompt])
    .select(SELECT_FULL)
    .single();

  if (error) throw error;
  return mapDbPromptToPrompt(result);
}

/**
 * Updates an existing prompt
 */
export async function updatePrompt(
  id: string,
  data: UpdatePromptData,
  userId: string
): Promise<Prompt> {
  const dbUpdates: any = { updated_by: userId };

  if (data.title !== undefined) dbUpdates.title = data.title;
  if (data.category !== undefined) dbUpdates.category = data.category;
  if (data.subcategory !== undefined) dbUpdates.subcategory = data.subcategory;
  if (data.content !== undefined) dbUpdates.content = data.content;
  if (data.description !== undefined) dbUpdates.description = data.description;
  if (data.number !== undefined) dbUpdates.number = data.number;
  if (data.isFavorite !== undefined) dbUpdates.is_favorite = data.isFavorite;
  if (data.usageCount !== undefined) dbUpdates.usage_count = data.usageCount;
  if (data.previewImage !== undefined) dbUpdates.preview_image = data.previewImage;
  if (data.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = data.thumbnailUrl;
  if (data.isPublic !== undefined) dbUpdates.is_public = data.isPublic;
  if (data.tags !== undefined) dbUpdates.tags = data.tags;
  if (data.keywords !== undefined) dbUpdates.keywords = data.keywords;
  if (data.styleTags !== undefined) dbUpdates.style_tags = data.styleTags;
  if (data.subjectTags !== undefined) dbUpdates.subject_tags = data.subjectTags;

  const { data: result, error } = await supabase
    .from('prompts')
    .update(dbUpdates)
    .eq('id', id)
    .select(SELECT_FULL)
    .single();

  if (error) throw error;
  return mapDbPromptToPrompt(result);
}

/**
 * Deletes a prompt from the database
 */
export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Fetches a single prompt by ID (com dados completos)
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select(SELECT_FULL)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapDbPromptToPrompt(data);
}

/**
 * Fetches preview image for a prompt
 */
export async function fetchPreviewImage(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select('preview_image')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data?.preview_image || null;
}

/**
 * Imports multiple prompts from content
 */
export async function importPrompts(
  content: string,
  userId: string
): Promise<Prompt[]> {
  const promptsToImport = parseImportContent(content);

  const dbPrompts = promptsToImport.map(prompt => ({
    title: prompt.title || 'Untitled',
    category: prompt.category || 'Geral',
    subcategory: prompt.subcategory,
    content: prompt.content || '',
    description: prompt.description,
    number: prompt.number,
    tags: prompt.tags || [],
    keywords: prompt.keywords || [],
    style_tags: prompt.styleTags || [],
    subject_tags: prompt.subjectTags || [],
    created_by: userId,
    updated_by: userId,
    is_favorite: false,
    usage_count: 0,
    is_public: false,
  }));

  const { data, error } = await supabase
    .from('prompts')
    .insert(dbPrompts)
    .select(SELECT_FULL);

  if (error) throw error;
  return (data || []).map(mapDbPromptToPrompt);
}

/**
 * Counts prompts with optional filters
 */
export async function countPrompts(options: {
  personalOnly?: boolean;
  userId?: string;
  onlyMissingImages?: boolean;
} = {}): Promise<number> {
  const { personalOnly = false, userId, onlyMissingImages = false } = options;

  let query = supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true });

  if (personalOnly && userId) {
    query = query.eq('created_by', userId);
  } else if (!personalOnly) {
    query = query.eq('is_public', true);
  }

  if (onlyMissingImages) {
    query = query.is('preview_image', null);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error counting prompts:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Parses import content into individual prompts
 */
function parseImportContent(content: string): Partial<Prompt>[] {
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
      number: parsed.number,
    };
  };

  const separationStrategies = [
    {
      name: 'numbered',
      pattern: /(?:^|\n)(?:\d+\.?\s*(?:Prompt:?\s*)?)/gm,
      split: (content: string) => {
        const parts = content.split(/(?:^|\n)(?:\d+\.?\s*(?:Prompt:?\s*)?)/gm);
        return parts.filter(part => part.trim().length > 20);
      },
    },
    {
      name: 'headers',
      pattern: /(?:^|\n)#{1,6}\s+/gm,
      split: (content: string) => {
        const parts = content.split(/(?:^|\n)#{1,6}\s+/gm);
        return parts.filter(part => part.trim().length > 20);
      },
    },
    {
      name: 'categories',
      pattern: /\*\*\[.*?\]\*\*/gm,
      split: (content: string) => {
        const parts = content.split(/(?=\*\*\[.*?\]\*\*)/gm);
        return parts.filter(part => part.trim().length > 20);
      },
    },
    {
      name: 'paragraphs',
      pattern: /\n\s*\n/gm,
      split: (content: string) => {
        const parts = content.split(/\n\s*\n/gm);
        return parts.filter(part => part.trim().length > 50);
      },
    },
    {
      name: 'keywords',
      pattern: /(?:^|\n)(?:prompt|scene|description|image|photo|picture|design)[:.]?\s*/gmi,
      split: (content: string) => {
        const parts = content.split(/(?:^|\n)(?:prompt|scene|description|image|photo|picture|design)[:.]?\s*/gmi);
        return parts.filter(part => part.trim().length > 20);
      },
    },
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
    const parts = bestStrategy.split(content);
    parts.forEach((part: string, index: number) => {
      if (part.trim().length > 20) {
        promptsToImport.push(createPromptObject(part, index));
      }
    });
  } else {
    promptsToImport.push(createPromptObject(content, 0));
  }

  return promptsToImport;
}
