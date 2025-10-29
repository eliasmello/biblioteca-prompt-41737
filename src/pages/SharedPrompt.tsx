import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSEO } from '@/hooks/useSEO';
import { Prompt } from '@/types/prompt';
import {
  ArrowLeft,
  Copy,
  Share2,
  Calendar,
  Eye,
  Lock,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SharedPrompt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSEO({
    title: prompt ? `${prompt.title} - Prompt Compartilhado` : 'Prompt Compartilhado',
    description: prompt?.description || 'Visualize este prompt compartilhado',
    canonicalPath: `/shared/${id}`,
  });

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', id)
          .eq('is_public', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setNotFound(true);
          } else {
            throw error;
          }
          return;
        }

        const mappedPrompt: Prompt = {
          id: data.id,
          number: data.number,
          title: data.title,
          category: data.category,
          subcategory: data.subcategory,
          content: data.content,
          description: data.description,
          tags: data.tags || [],
          keywords: data.keywords || [],
          styleTags: data.style_tags || [],
          subjectTags: data.subject_tags || [],
          createdBy: data.created_by,
          created_by: data.created_by,
          updatedBy: data.updated_by,
          updated_by: data.updated_by,
          isFavorite: data.is_favorite || false,
          usageCount: data.usage_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          previewImage: data.preview_image,
          isPublic: data.is_public,
        };

        setPrompt(mappedPrompt);

        // Increment usage count
        await supabase
          .from('prompts')
          .update({ usage_count: (data.usage_count || 0) + 1 })
          .eq('id', id);
      } catch (error: any) {
        console.error('Erro ao buscar prompt:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o prompt.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id, toast]);

  const handleCopy = () => {
    if (!prompt) return;
    const cleanContent = prompt.content.replace(/^#?\s*prompt\s*#?\d*:?\s*/i, '').trim();
    navigator.clipboard.writeText(cleanContent);
    toast({
      title: 'Copiado!',
      description: 'Prompt copiado para a área de transferência.',
    });
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (notFound || !prompt) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Prompt não disponível</h2>
            <p className="text-muted-foreground mb-6">
              Este prompt não existe ou não está mais público.
            </p>
            <Button onClick={() => navigate('/gallery')}>
              <Globe className="w-4 h-4 mr-2" />
              Ver Galeria Pública
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cleanContent = prompt.content.replace(/^#?\s*prompt\s*#?\d*:?\s*/i, '').trim();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/gallery')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Galeria
        </Button>
      </div>

      {/* Prompt Details */}
      <Card className="glass">
        <CardContent className="p-8 space-y-6">
          {/* Title and Categories */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {prompt.number && (
                    <Badge variant="outline" className="font-mono">
                      #{prompt.number}
                    </Badge>
                  )}
                  <Badge className="bg-primary text-primary-foreground">
                    {prompt.category}
                  </Badge>
                  {prompt.subcategory && (
                    <Badge variant="outline">{prompt.subcategory}</Badge>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    Público
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold">{prompt.title}</h1>
                {prompt.description && (
                  <p className="text-muted-foreground mt-2">{prompt.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preview Image */}
          {prompt.previewImage && (
            <div className="aspect-video rounded-lg overflow-hidden border border-border">
              <img
                src={prompt.previewImage}
                alt={`Preview do prompt ${prompt.title}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conteúdo do Prompt</h3>
              <Button onClick={handleCopy} className="gap-2">
                <Copy className="w-4 h-4" />
                Copiar Prompt
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono">{cleanContent}</pre>
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          {(prompt.styleTags.length > 0 || prompt.subjectTags.length > 0) && (
            <div className="space-y-3">
              {prompt.styleTags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Style Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {prompt.styleTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {prompt.subjectTags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Subject Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {prompt.subjectTags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {prompt.usageCount} visualizações
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(prompt.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
