import { supabase } from '@/integrations/supabase/client';
import { Prompt } from '@/types/prompt';
import { parsePromptContent } from '@/lib/prompt-parser';

const PAGE_SIZE = 100;

export interface FetchPromptsOptions {
  personalOnly?: boolean;
  userId?: string;
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
    styleTags: dbPrompt.style_tags || [],
    subjectTags: dbPrompt.subject_tags || [],
    createdBy: dbPrompt.created_by,
    updatedBy: dbPrompt.updated_by,
    isFavorite: dbPrompt.is_favorite,
    usageCount: dbPrompt.usage_count,
    createdAt: dbPrompt.created_at,
    updatedAt: dbPrompt.updated_at,
    previewImage: dbPrompt.preview_image ?? null,
  };
}

/**
 * Fetches prompts from the database with pagination
 */
export async function fetchPrompts(options: FetchPromptsOptions = {}): Promise<Prompt[]> {
  const { personalOnly = false, userId } = options;
  
  if (!userId) {
    throw new Error('User ID is required to fetch prompts');
  }

  const allPrompts: Prompt[] = [];
  const seen = new Set<string>();
  let from = 0;

  while (true) {
    let query = supabase
      .from('prompts')
      .select(`
        id, title, category, subcategory, content, description, number,
        tags, keywords, style_tags, subject_tags, created_by, updated_by,
        is_favorite, usage_count, created_at, updated_at, is_public
      `)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (personalOnly) {
      query = query.eq('created_by', userId);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) break;

    const mapped = data.map(mapDbPromptToPrompt);
    
    for (const prompt of mapped) {
      if (!seen.has(prompt.id)) {
        seen.add(prompt.id);
        allPrompts.push(prompt);
      }
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allPrompts;
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
    .select(`
      id, title, category, subcategory, content, description, number,
      tags, keywords, style_tags, subject_tags, created_by, updated_by,
      is_favorite, usage_count, created_at, updated_at, preview_image, is_public
    `)
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
  if (data.isPublic !== undefined) dbUpdates.is_public = data.isPublic;
  if (data.tags !== undefined) dbUpdates.tags = data.tags;
  if (data.keywords !== undefined) dbUpdates.keywords = data.keywords;
  if (data.styleTags !== undefined) dbUpdates.style_tags = data.styleTags;
  if (data.subjectTags !== undefined) dbUpdates.subject_tags = data.subjectTags;

  const { data: result, error } = await supabase
    .from('prompts')
    .update(dbUpdates)
    .eq('id', id)
    .select(`
      id, title, category, subcategory, content, description, number,
      tags, keywords, style_tags, subject_tags, created_by, updated_by,
      is_favorite, usage_count, created_at, updated_at, preview_image, is_public
    `)
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
 * Fetches a single prompt by ID
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select(`
      id, title, category, subcategory, content, description, number,
      tags, keywords, style_tags, subject_tags, created_by, updated_by,
      is_favorite, usage_count, created_at, updated_at, preview_image, is_public
    `)
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
    .select(`
      id, title, category, subcategory, content, description, number,
      tags, keywords, style_tags, subject_tags, created_by, updated_by,
      is_favorite, usage_count, created_at, updated_at, preview_image, is_public
    `);

  if (error) throw error;
  return (data || []).map(mapDbPromptToPrompt);
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
