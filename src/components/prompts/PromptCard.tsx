import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Calendar, Eye, Edit, Trash2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from "react";

interface PromptCardProps {
  prompt: any;
  onPreview: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (content: string) => void;
  onEdit?: (id: string, promptData?: { content: string; previewImage?: string | null }) => void;
  onDelete?: (id: string) => void;
}

export function PromptCard({ prompt, onPreview, onToggleFavorite, onCopy, onEdit, onDelete }: PromptCardProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(prompt.previewImage || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(!!prompt.previewImage);

  const cleanPromptContent = (content: string) => {
    // Remove prompt number and "prompt:" prefix
    return content.replace(/^#?\s*prompt\s*#?\d*:?\s*/i, '').trim();
  };

  // Função para carregar imagem sob demanda
  const loadImage = useCallback(async () => {
    if (imageLoaded || imageLoading) return;
    
    setImageLoading(true);
    try {
      const { data } = await supabase
        .from('prompts')
        .select('preview_image')
        .eq('id', prompt.id)
        .single();
      
      if (data?.preview_image) {
        setPreviewImage(data.preview_image);
        setImageLoaded(true);
      }
    } catch (error) {
      console.log('Erro ao carregar imagem:', error);
    } finally {
      setImageLoading(false);
    }
  }, [prompt.id, imageLoaded, imageLoading]);

  useEffect(() => {
    // Se já tem imagem, marcar como carregada
    if (prompt.previewImage) {
      setPreviewImage(prompt.previewImage);
      setImageLoaded(true);
    } else {
      // Se não tem imagem, resetar estado
      setPreviewImage(null);
      setImageLoaded(false);
    }
  }, [prompt.previewImage]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(cleanPromptContent(prompt.content));
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 glass relative overflow-hidden"
      onClick={() => onPreview(prompt.id)}
    >
      <CardContent className="p-6">
        {/* Image preview */}
        <div className="mb-4 relative">
          <div 
            className="aspect-video bg-muted rounded-lg overflow-hidden border border-border/50 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              if (!imageLoaded && !imageLoading) {
                loadImage();
              }
            }}
          >
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : previewImage ? (
              <img 
                src={previewImage} 
                alt="Prompt preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Clique para carregar
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Favorite indicator */}
        {prompt.isFavorite && (
          <div className="absolute top-2 left-2 z-10">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          </div>
        )}

        {/* Action buttons - show on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(prompt.id);
            }}
            className="w-8 h-8 p-0"
          >
            <Star className={cn("w-3 h-3", prompt.isFavorite && "fill-current")} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            className="w-8 h-8 p-0"
          >
            <Copy className="w-3 h-3" />
          </Button>
          {onEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prompt.id, {
                  content: cleanPromptContent(prompt.content),
                  previewImage: previewImage
                });
              }}
              className="w-8 h-8 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(prompt.id);
              }}
              className="w-8 h-8 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Header */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            {prompt.number && (
              <Badge variant="outline" className="font-mono text-xs">
                #{prompt.number}
              </Badge>
            )}
            <Badge className="bg-primary text-primary-foreground text-xs">
              {prompt.category}
            </Badge>
            {prompt.subcategory && (
              <Badge variant="outline" className="text-xs">
                {prompt.subcategory}
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {prompt.title}
          </h3>
        </div>

        {/* Content preview */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {cleanPromptContent(prompt.content)}
        </p>

        {/* Tags */}
        {(prompt.styleTags?.length > 0 || prompt.subjectTags?.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-4">
            {prompt.styleTags?.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {prompt.subjectTags?.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {(prompt.styleTags?.length > 3 || prompt.subjectTags?.length > 2) && (
              <Badge variant="secondary" className="text-xs">
                +{(prompt.styleTags?.length || 0) + (prompt.subjectTags?.length || 0) - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Usage count and date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {prompt.usageCount || 0} uses
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(prompt.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}