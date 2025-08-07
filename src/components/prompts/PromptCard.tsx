import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Star, Eye, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptCardProps {
  prompt: {
    id: string;
    number?: number;
    title: string;
    category: string;
    subcategory?: string;
    content: string;
    tags: string[];
    styleTags: string[];
    isFavorite: boolean;
    usageCount: number;
    createdAt: string;
  };
  onPreview: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (content: string) => void;
}

export function PromptCard({ prompt, onPreview, onToggleFavorite, onCopy }: PromptCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    onCopy(prompt.content);
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02] glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {prompt.number && (
                <Badge variant="outline" className="text-xs font-mono">
                  #{prompt.number}
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {prompt.category}
                </Badge>
                {prompt.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {prompt.subcategory}
                  </Badge>
                )}
              </div>
            </div>
            
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {prompt.title}
            </h3>
            
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {prompt.content.slice(0, 120)}...
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(prompt.id)}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              prompt.isFavorite && "opacity-100 text-yellow-500"
            )}
          >
            <Star className={cn("w-4 h-4", prompt.isFavorite && "fill-current")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {prompt.styleTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs bg-primary-muted text-primary">
              {tag}
            </Badge>
          ))}
          {prompt.styleTags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{prompt.styleTags.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(prompt.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{prompt.usageCount} uses</span>
            <span>•</span>
            <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}