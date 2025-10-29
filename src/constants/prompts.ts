/**
 * Constants related to prompts
 */

export const PROMPT_CATEGORIES = [
  'Geral',
  'Fotografia',
  'Design',
  'Arte',
  'Produto',
  'Publicidade',
  'Natureza',
  'Pessoas',
  'Animais',
  '3D',
  'Abstrato',
] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'oldest', label: 'Mais Antigos' },
  { value: 'title', label: 'Título (A-Z)' },
  { value: 'category', label: 'Categoria' },
  { value: 'usage', label: 'Mais Usados' },
] as const;

export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
} as const;

export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  TXT: 'txt',
} as const;

export const MIN_PROMPT_LENGTH = 20;
export const MAX_PROMPT_LENGTH = 5000;
export const DEFAULT_PAGE_SIZE = 100;
