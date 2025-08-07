import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Star, Edit, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    // You could add a toast notification here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
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

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(prompt.id)}
                className={cn(prompt.isFavorite && "text-yellow-500")}
              >
                <Star className={cn("w-4 h-4", prompt.isFavorite && "fill-current")} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(prompt.id)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Prompt Content</h3>
              <Button onClick={handleCopy} size="sm" variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 font-mono text-sm">
              <div className="prompt-highlight whitespace-pre-wrap">
                {prompt.content}
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Tags & Metadata</h3>
            
            <div className="grid gap-4">
              {prompt.styleTags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Style Tags</h4>
                  <div className="flex flex-wrap gap-1">
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
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Subject Tags</h4>
                  <div className="flex flex-wrap gap-1">
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
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">General Tags</h4>
                  <div className="flex flex-wrap gap-1">
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

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{prompt.usageCount}</p>
              <p className="text-sm text-muted-foreground">Times Used</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-accent">
                {prompt.content.split(' ').length}
              </p>
              <p className="text-sm text-muted-foreground">Words</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-success">
                {new Date(prompt.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">Created</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}