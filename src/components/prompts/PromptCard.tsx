import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Calendar, Eye, Edit, Trash2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, memo } from "react";

interface PromptCardProps {
  prompt: any;
  onPreview: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (content: string) => void;
  onEdit?: (id: string, promptData?: { content: string; previewImage?: string | null }) => void;
  onDelete?: (id: string) => void;
  loadPreview: (id: string) => void;
  variant?: 'grid' | 'list';
}

function PromptCardComponent({ prompt, onPreview, onToggleFavorite, onCopy, onEdit, onDelete, loadPreview, variant = 'grid' }: PromptCardProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(prompt.previewImage || null);
  const [requestedImage, setRequestedImage] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const cleanPromptContent = (content: string) => {
    // Remove prompt number and "prompt:" prefix
    return content.replace(/^#?\s*prompt\s*#?\d*:?\s*/i, '').trim();
  };

  useEffect(() => {
    setPreviewImage(prompt.previewImage || null);
  }, [prompt.previewImage]);

  // Busca a imagem de preview apenas quando o card entrar na viewport
  useEffect(() => {
    const el = previewRef.current;
    if (!el || previewImage || requestedImage) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !previewImage && !requestedImage) {
          loadPreview(prompt.id);
          setRequestedImage(true);
          observer.disconnect();
          break;
        }
      }
    }, { rootMargin: '200px' });

    observer.observe(el);
    return () => observer.disconnect();
  }, [previewImage, requestedImage, loadPreview, prompt.id]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(cleanPromptContent(prompt.content));
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 glass relative overflow-hidden"
      onClick={() => onPreview(prompt.id)}
    >
      <CardContent className={cn("p-6 md:flex md:gap-6 md:items-start", variant === 'list' && "flex gap-4 sm:gap-6 items-start")}>
        {/* Image preview */}
        <div className={cn('relative w-full md:w-48 shrink-0', variant === 'grid' ? 'mb-4 md:mb-0' : 'mb-0')}>
          <div 
            ref={previewRef}
            className={cn(
              'w-full bg-muted rounded-lg overflow-hidden border border-border/50',
              'aspect-video md:aspect-auto md:h-28'
            )}
          >
            {previewImage ? (
              <img 
                src={previewImage} 
                alt={`Preview do prompt ${prompt.title}`} 
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={112}
                height={80}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs">Sem imagem</span>
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

        {/* Action buttons */}
        {variant === 'grid' && (
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
        )}

        <div className={cn(
          "md:flex-1 md:min-w-0",
          variant === 'list' ? "flex-1 min-w-0 md:pl-0 md:border-l-0" : "md:pl-6 md:border-l md:border-border/50"
        )}>
          {/* Header */}
          {variant === 'list' ? (
            <div className="mb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {prompt.number && (
                      <Badge variant="outline" className="font-mono text-xs">
                        #{prompt.number}
                      </Badge>
                    )}
                    <Badge className="bg-primary/10 text-primary border-transparent text-xs">
                      {prompt.category}
                    </Badge>
                    {prompt.subcategory && (
                      <Badge variant="outline" className="bg-foreground/5 text-foreground/80 border-border/50 text-xs">
                        {prompt.subcategory}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-lg leading-tight line-clamp-1 md:line-clamp-2 group-hover:text-primary transition-colors">
                    {prompt.title}
                  </h3>
                </div>
                <div className="flex gap-1 shrink-0">
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
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                {prompt.number && (
                  <Badge variant="outline" className="font-mono text-xs">
                    #{prompt.number}
                  </Badge>
                )}
                <Badge className="bg-primary/10 text-primary border-transparent text-xs">
                  {prompt.category}
                </Badge>
                {prompt.subcategory && (
                  <Badge variant="outline" className="bg-foreground/5 text-foreground/80 border-border/50 text-xs">
                    {prompt.subcategory}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {prompt.title}
              </h3>
            </div>
          )}

          {/* Content preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3 mb-4">
            {cleanPromptContent(prompt.content)}
          </p>

          {/* Tags */}
          {(prompt.styleTags?.length > 0 || prompt.subjectTags?.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-4">
              {prompt.styleTags?.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-primary/10 text-primary border-transparent text-xs">
                  {tag}
                </Badge>
              ))}
              {prompt.subjectTags?.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-foreground/5 text-foreground/80 border-border/50 text-xs">
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
        </div>
      </CardContent>
    </Card>
  );
}

export const PromptCard = memo(PromptCardComponent);
