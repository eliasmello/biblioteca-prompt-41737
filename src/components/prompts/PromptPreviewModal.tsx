
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Star, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import "./PromptPreviewModal.css";

interface PromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: {
    id: string;
    number?: number;
    title: string;
    category: string;
    subcategory?: string;
    content: string;
    tags: string[];
    styleTags: string[];
    subjectTags: string[];
    isFavorite: boolean;
    usageCount: number;
    createdAt: string;
    previewImage?: string | null;
  } | null;
  onToggleFavorite: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PromptPreviewModal({
  isOpen,
  onClose,
  prompt,
  onToggleFavorite,
  onEdit,
  onDelete,
}: PromptPreviewModalProps) {
  if (!prompt) return null;

  const cleanPromptContent = (content: string) => {
    // Remove prompt number and "prompt:" prefix
    return content.replace(/^#?\s*prompt\s*#?\d*:?\s*/i, '').trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanPromptContent(prompt.content));
    // You could add a toast notification here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar glass">
        <DialogHeader className="relative">
          {/* Action buttons - positioned absolutely in top-right */}
          <div className="absolute top-0 right-0 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(prompt.id)}
              className={cn(
                "h-8 w-8 p-0 hover:bg-accent/50 transition-colors",
                prompt.isFavorite && "text-yellow-500 hover:text-yellow-600"
              )}
              title={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("w-4 h-4", prompt.isFavorite && "fill-current")} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(prompt.id)}
              className="h-8 w-8 p-0 hover:bg-accent/50 transition-colors"
              title="Edit prompt"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          <div className="pr-20">
            <div className="flex items-center gap-2 mb-2">
              {prompt.number && (
                <Badge variant="outline" className="font-mono">
                  #{prompt.number}
                </Badge>
              )}
              <Badge className="bg-primary text-primary-foreground">
                {prompt.category}
              </Badge>
              {prompt.subcategory && (
                <Badge variant="outline">
                  {prompt.subcategory}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-xl font-bold gradient-text">
              {prompt.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Grid principal: conteúdo à esquerda; imagem + tags + stats à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna esquerda: Conteúdo */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Prompt Content</h3>
              <Button onClick={handleCopy} size="sm" variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 font-mono text-sm">
              <div className="prompt-highlight whitespace-pre-wrap leading-relaxed">
                {cleanPromptContent(prompt.content)}
              </div>
            </div>
          </div>

          {/* Coluna direita: Imagem, Tags, Stats */}
          <div className="lg:col-span-5 space-y-4">
            {/* Preview Image */}
            {prompt.previewImage && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={prompt.previewImage}
                  alt={`Preview do prompt ${prompt.title}`}
                  className="w-full h-56 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}

            {/* Tags */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Tags & Metadata</h3>
              
              <div className="grid gap-3">
                {prompt.styleTags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Style</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.styleTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-primary-muted text-primary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {prompt.subjectTags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Subject</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.subjectTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-accent-muted text-accent">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {prompt.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">General</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="space-y-1">
                <p className="text-xl font-bold text-primary">{prompt.usageCount}</p>
                <p className="text-xs text-muted-foreground">Times Used</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-accent">
                  {prompt.content.split(' ').length}
                </p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-success">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
