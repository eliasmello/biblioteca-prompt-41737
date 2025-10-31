import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Calendar, Eye, Edit, Trash2, ImageIcon, Sparkles } from "lucide-react";
import { cn, toTitleCase } from "@/lib/utils";
import { useState, useEffect, memo } from "react";
import { LazyImage } from "@/components/ui/lazy-image";

interface PromptCardProps {
  prompt: any;
  onPreview: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (content: string) => void;
  onEdit?: (id: string, promptData?: { content: string; previewImage?: string | null }) => void;
  onDelete?: (id: string) => void;
  onGenerateImage?: (id: string, content: string) => Promise<void>;
  isGeneratingImage?: boolean;
  loadPreview: (id: string) => void;
  variant?: 'grid' | 'list';
}

function PromptCardComponent({ prompt, onPreview, onToggleFavorite, onCopy, onEdit, onDelete, onGenerateImage, isGeneratingImage, loadPreview, variant = 'grid' }: PromptCardProps) {
  const cleanPromptContent = (content: string) => {
    // Remove prompt number and "prompt:" prefix
    return content.replace(/^#?\s*prompt\s*#?\d*:?\s*/i, '').trim();
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(cleanPromptContent(prompt.content));
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 glass relative overflow-hidden"
      onClick={() => onPreview(prompt.id)}
    >
      <CardContent className={cn("p-6", variant === 'list' && "flex gap-4 sm:gap-6 items-center md:items-start")}>
        {/* Image preview */}
        <div className={cn('relative', variant === 'list' ? 'w-28 sm:w-40 md:w-48 shrink-0' : 'mb-4')}>
          {(() => {
            const thumbnailUrl = prompt.thumbnail_url || prompt.thumbnailUrl || prompt.previewImage;
            const fullImageUrl = prompt.preview_image || prompt.previewImage;
            
            return (
              <LazyImage
                src={thumbnailUrl}
                fullSrc={thumbnailUrl === fullImageUrl ? undefined : fullImageUrl}
                alt={`Preview do prompt ${prompt.title}`}
                className={cn(
                  variant === 'list' ? 'h-20 sm:h-24 md:h-28 w-full' : 'aspect-video',
                  'rounded-lg'
                )}
                cached={true}
              />
            );
          })()}
        </div>

        {/* Favorite indicator */}
        {prompt.isFavorite && (
          <div className="absolute top-2 left-2 z-10">
            <Star className="w-4 h-4 text-favorite fill-current" />
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
            {onGenerateImage && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateImage(prompt.id, cleanPromptContent(prompt.content));
                }}
                disabled={isGeneratingImage}
                className="w-8 h-8 p-0"
                title="Gerar imagem com IA"
              >
                {isGeneratingImage ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(prompt.id, {
                    content: cleanPromptContent(prompt.content),
                    previewImage: prompt.previewImage || null
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

        <div className={cn(variant === 'list' && "flex-1 min-w-0")}> 
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
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {toTitleCase(prompt.category)}
                    </Badge>
                    {prompt.subcategory && (
                      <Badge variant="outline" className="text-xs">
                        {toTitleCase(prompt.subcategory)}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-lg leading-tight line-clamp-1 md:line-clamp-2 group-hover:text-primary transition-colors">
                    {toTitleCase(prompt.title)}
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
                  {onGenerateImage && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenerateImage(prompt.id, cleanPromptContent(prompt.content));
                      }}
                      disabled={isGeneratingImage}
                      className="w-8 h-8 p-0"
                      title="Gerar imagem com IA"
                    >
                      {isGeneratingImage ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(prompt.id, {
                          content: cleanPromptContent(prompt.content),
                          previewImage: prompt.previewImage || null
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
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {toTitleCase(prompt.category)}
                </Badge>
                {prompt.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {toTitleCase(prompt.subcategory)}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {toTitleCase(prompt.title)}
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
                <Badge key={tag} variant="secondary" className="text-xs">
                  {toTitleCase(tag)}
                </Badge>
              ))}
              {prompt.subjectTags?.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {toTitleCase(tag)}
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
