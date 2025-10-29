import { Prompt } from "@/types/prompt";

export type ExportFormat = 'json' | 'csv' | 'txt';

interface ExportOptions {
  format: ExportFormat;
  prompts: Prompt[];
  filename?: string;
}

/**
 * Exporta prompts para JSON
 */
export const exportToJSON = (prompts: Prompt[]): string => {
  return JSON.stringify(prompts, null, 2);
};

/**
 * Exporta prompts para CSV
 */
export const exportToCSV = (prompts: Prompt[]): string => {
  if (prompts.length === 0) return '';

  // Headers
  const headers = [
    'ID',
    'Título',
    'Categoria',
    'Subcategoria',
    'Conteúdo',
    'Descrição',
    'Tags',
    'Palavras-chave',
    'Tags de Estilo',
    'Tags de Assunto',
    'É Público',
    'É Favorito',
    'Contagem de Uso',
    'Número',
    'Criado em',
    'Atualizado em'
  ];

  // Função para escapar valores CSV
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Se contém vírgula, quebra de linha ou aspas, precisa ser escapado
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Converte array para string separada por ponto e vírgula
  const arrayToString = (arr: any[] | null | undefined): string => {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.join('; ');
  };

  // Rows
  const rows = prompts.map(prompt => [
    escapeCSV(prompt.id),
    escapeCSV(prompt.title),
    escapeCSV(prompt.category),
    escapeCSV(prompt.subcategory),
    escapeCSV(prompt.content),
    escapeCSV(prompt.description),
    escapeCSV(arrayToString(prompt.tags)),
    escapeCSV(arrayToString(prompt.keywords)),
    escapeCSV(arrayToString(prompt.styleTags)),
    escapeCSV(arrayToString(prompt.subjectTags)),
    escapeCSV(prompt.isPublic || prompt.is_public ? 'Sim' : 'Não'),
    escapeCSV(prompt.isFavorite || prompt.is_favorite ? 'Sim' : 'Não'),
    escapeCSV(prompt.usageCount || prompt.usage_count || 0),
    escapeCSV(prompt.number || ''),
    escapeCSV(prompt.createdAt || prompt.created_at || ''),
    escapeCSV(prompt.updatedAt || prompt.updated_at || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Exporta prompts para TXT (formato legível)
 */
export const exportToTXT = (prompts: Prompt[]): string => {
  return prompts.map((prompt, index) => {
    let text = '';
    
    text += `========================================\n`;
    text += `PROMPT ${index + 1}: ${prompt.title}\n`;
    text += `========================================\n\n`;
    
    if (prompt.category) {
      text += `📁 Categoria: ${prompt.category}`;
      if (prompt.subcategory) text += ` / ${prompt.subcategory}`;
      text += `\n`;
    }
    
    if (prompt.description) {
      text += `📝 Descrição: ${prompt.description}\n`;
    }
    
    if (prompt.tags && prompt.tags.length > 0) {
      text += `🏷️ Tags: ${prompt.tags.join(', ')}\n`;
    }
    
    if (prompt.keywords && prompt.keywords.length > 0) {
      text += `🔑 Palavras-chave: ${prompt.keywords.join(', ')}\n`;
    }
    
    text += `\n`;
    text += `📄 CONTEÚDO:\n`;
    text += `${prompt.content}\n\n`;
    
    const styleTags = prompt.styleTags;
    const subjectTags = prompt.subjectTags;
    
    if (styleTags && styleTags.length > 0) {
      text += `🎨 Tags de Estilo: ${styleTags.join(', ')}\n`;
    }
    
    if (subjectTags && subjectTags.length > 0) {
      text += `🎯 Tags de Assunto: ${subjectTags.join(', ')}\n`;
    }
    
    const isPublic = prompt.isPublic || prompt.is_public;
    const isFavorite = prompt.isFavorite || prompt.is_favorite;
    const usageCount = prompt.usageCount || prompt.usage_count || 0;
    
    text += `\n`;
    text += `ℹ️ Informações:\n`;
    text += `   • Público: ${isPublic ? 'Sim' : 'Não'}\n`;
    text += `   • Favorito: ${isFavorite ? 'Sim' : 'Não'}\n`;
    text += `   • Uso: ${usageCount} vezes\n`;
    
    const createdAt = prompt.createdAt || prompt.created_at;
    const updatedAt = prompt.updatedAt || prompt.updated_at;
    
    if (createdAt) {
      text += `   • Criado em: ${new Date(createdAt).toLocaleString('pt-BR')}\n`;
    }
    
    if (updatedAt) {
      text += `   • Atualizado em: ${new Date(updatedAt).toLocaleString('pt-BR')}\n`;
    }
    
    text += `\n\n`;
    
    return text;
  }).join('');
};

/**
 * Função principal de exportação
 */
export const exportPrompts = ({ format, prompts, filename }: ExportOptions) => {
  let content = '';
  let mimeType = '';
  let defaultFilename = filename || `prompts-backup-${new Date().toISOString().split('T')[0]}`;

  switch (format) {
    case 'json':
      content = exportToJSON(prompts);
      mimeType = 'application/json';
      defaultFilename += '.json';
      break;
    
    case 'csv':
      content = exportToCSV(prompts);
      mimeType = 'text/csv;charset=utf-8;';
      defaultFilename += '.csv';
      break;
    
    case 'txt':
      content = exportToTXT(prompts);
      mimeType = 'text/plain;charset=utf-8;';
      defaultFilename += '.txt';
      break;
    
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }

  // Criar blob e fazer download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename: defaultFilename,
    count: prompts.length
  };
};

/**
 * Valida se um JSON é um array de prompts válido
 */
export const validatePromptsJSON = (json: any): { valid: boolean; error?: string } => {
  if (!Array.isArray(json)) {
    return { valid: false, error: 'O arquivo deve conter um array de prompts' };
  }

  if (json.length === 0) {
    return { valid: false, error: 'O arquivo não contém prompts' };
  }

  // Validar estrutura básica do primeiro prompt
  const firstPrompt = json[0];
  
  if (!firstPrompt.title || !firstPrompt.content) {
    return { valid: false, error: 'Os prompts devem ter pelo menos title e content' };
  }

  return { valid: true };
};

/**
 * Normaliza prompts importados para o formato esperado
 */
export const normalizeImportedPrompts = (prompts: any[]): Partial<Prompt>[] => {
  return prompts.map(prompt => ({
    title: prompt.title || prompt.Title || '',
    content: prompt.content || prompt.Content || prompt.Conteúdo || '',
    description: prompt.description || prompt.Description || prompt.Descrição || '',
    category: prompt.category || prompt.Category || prompt.Categoria || '',
    subcategory: prompt.subcategory || prompt.Subcategory || prompt.Subcategoria || '',
    tags: Array.isArray(prompt.tags) ? prompt.tags : 
          Array.isArray(prompt.Tags) ? prompt.Tags : [],
    keywords: Array.isArray(prompt.keywords) ? prompt.keywords :
              Array.isArray(prompt.Keywords) ? prompt.Keywords :
              Array.isArray(prompt['Palavras-chave']) ? prompt['Palavras-chave'] : [],
    styleTags: Array.isArray(prompt.styleTags) ? prompt.styleTags :
               Array.isArray(prompt.style_tags) ? prompt.style_tags :
               Array.isArray(prompt['Tags de Estilo']) ? prompt['Tags de Estilo'] : [],
    subjectTags: Array.isArray(prompt.subjectTags) ? prompt.subjectTags :
                 Array.isArray(prompt.subject_tags) ? prompt.subject_tags :
                 Array.isArray(prompt['Tags de Assunto']) ? prompt['Tags de Assunto'] : [],
    isPublic: prompt.isPublic || prompt.is_public || prompt['É Público'] === 'Sim' || false,
    isFavorite: prompt.isFavorite || prompt.is_favorite || prompt['É Favorito'] === 'Sim' || false,
    number: prompt.number || prompt.Number || prompt.Número || undefined,
  }));
};
