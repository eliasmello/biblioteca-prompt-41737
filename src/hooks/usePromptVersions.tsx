import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PromptVersion } from '@/types/version';
import { useToast } from './use-toast';

export function usePromptVersions(promptId: string | null) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchVersions = async () => {
    if (!promptId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      const mappedVersions: PromptVersion[] = (data || []).map((v: any) => ({
        id: v.id,
        promptId: v.prompt_id,
        versionNumber: v.version_number,
        title: v.title,
        category: v.category,
        subcategory: v.subcategory,
        content: v.content,
        description: v.description,
        tags: v.tags || [],
        keywords: v.keywords || [],
        styleTags: v.style_tags || [],
        subjectTags: v.subject_tags || [],
        previewImage: v.preview_image,
        createdBy: v.created_by,
        createdAt: v.created_at,
        changeSummary: v.change_summary,
      }));

      setVersions(mappedVersions);
    } catch (error: any) {
      console.error('Erro ao buscar versões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de versões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (versionId: string) => {
    try {
      const version = versions.find(v => v.id === versionId);
      if (!version || !promptId) return;

      const { error } = await supabase
        .from('prompts')
        .update({
          title: version.title,
          category: version.category,
          subcategory: version.subcategory,
          content: version.content,
          description: version.description,
          tags: version.tags,
          keywords: version.keywords,
          style_tags: version.styleTags,
          subject_tags: version.subjectTags,
          preview_image: version.previewImage,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', promptId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Versão restaurada com sucesso.',
      });

      await fetchVersions();
      return true;
    } catch (error: any) {
      console.error('Erro ao restaurar versão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível restaurar a versão.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [promptId]);

  return {
    versions,
    loading,
    fetchVersions,
    restoreVersion,
  };
}
