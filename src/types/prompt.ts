export interface Prompt {
  id: string;
  number?: number;
  title: string;
  category: string;
  subcategory?: string;
  content: string;
  description?: string;
  tags: string[];
  keywords: string[];
  styleTags: string[];
  subjectTags: string[];
  createdBy: string;
  updatedBy: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedPrompt {
  category: string;
  subcategory?: string;
  number?: number;
  content: string;
  extractedTags: {
    style: string[];
    subject: string[];
    technical: string[];
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parentId?: string;
  createdBy: string;
  promptCount?: number;
}

export interface SearchFilters {
  query?: string;
  categories?: string[];
  subcategories?: string[];
  styleTags?: string[];
  subjectTags?: string[];
  complexity?: 'Simple' | 'Medium' | 'Complex';
  favoriteOnly?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SearchResult {
  prompts: Prompt[];
  totalCount: number;
  facets: {
    categories: { name: string; count: number }[];
    styleTags: { name: string; count: number }[];
    subjectTags: { name: string; count: number }[];
  };
  suggestions?: string[];
}