export interface PromptVersion {
  id: string;
  promptId: string;
  prompt_id?: string;
  versionNumber: number;
  version_number?: number;
  title: string;
  category: string;
  subcategory?: string;
  content: string;
  description?: string;
  tags: string[];
  keywords: string[];
  styleTags: string[];
  style_tags?: string[];
  subjectTags: string[];
  subject_tags?: string[];
  previewImage?: string | null;
  preview_image?: string | null;
  createdBy: string;
  created_by?: string;
  createdAt: string;
  created_at?: string;
  changeSummary?: string;
  change_summary?: string;
}
