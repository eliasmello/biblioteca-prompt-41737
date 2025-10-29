import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptCard } from "@/components/prompts/PromptCard";
import PromptCardSkeleton from "@/components/prompts/PromptCardSkeleton";
import { PromptPreviewModal } from "@/components/prompts/PromptPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import {
  Search,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Globe,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types/prompt";
import { useDebounce } from "@/hooks/useDebounce";

export default function PublicGallery() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useSEO({
    title: "Galeria Pública de Prompts - Explore e Descubra",
    description: "Explore nossa galeria pública de prompts de IA compartilhados pela comunidade. Encontre inspiração e descubra novos prompts para seus projetos.",
    canonicalPath: "/gallery",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch public prompts
  useEffect(() => {
    const fetchPublicPrompts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedPrompts: Prompt[] = (data || []).map((p: any) => ({
          id: p.id,
          number: p.number,
          title: p.title,
          category: p.category,
          subcategory: p.subcategory,
          content: p.content,
          description: p.description,
          tags: p.tags || [],
          keywords: p.keywords || [],
          styleTags: p.style_tags || [],
          subjectTags: p.subject_tags || [],
          createdBy: p.created_by,
          created_by: p.created_by,
          updatedBy: p.updated_by,
          updated_by: p.updated_by,
          isFavorite: p.is_favorite || false,
          is_favorite: p.is_favorite,
          usageCount: p.usage_count || 0,
          usage_count: p.usage_count,
          createdAt: p.created_at,
          created_at: p.created_at,
          updatedAt: p.updated_at,
          updated_at: p.updated_at,
          previewImage: p.preview_image,
          preview_image: p.preview_image,
          isPublic: p.is_public,
          is_public: p.is_public,
        }));

        setPrompts(mappedPrompts);
      } catch (error: any) {
        console.error('Erro ao buscar prompts públicos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a galeria pública.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPrompts();
  }, [toast]);

  // Get unique categories
  const categories = [
    { value: "all", label: "Todas as Categorias" },
    ...Array.from(new Set(prompts.map(p => p.category)))
      .filter(Boolean)
      .map(cat => ({ value: cat.toLowerCase(), label: cat }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ];

  const handlePreview = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      setSelectedPrompt(prompt);
      setIsPreviewOpen(true);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado!",
      description: "Prompt copiado para a área de transferência.",
    });
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/shared/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copiado!",
      description: "O link de compartilhamento foi copiado para a área de transferência.",
    });
  };

  const sortedPrompts = useMemo(() => {
    return [...prompts].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [prompts, sortBy]);

  const filteredPrompts = useMemo(() => {
    return sortedPrompts.filter(prompt => {
      const q = debouncedSearchQuery.toLowerCase();
      const matchesSearch = debouncedSearchQuery === '' || 
                           prompt.title.toLowerCase().includes(q) ||
                           prompt.content.toLowerCase().includes(q) ||
                           (prompt.category && prompt.category.toLowerCase().includes(q)) ||
                           (prompt.tags && prompt.tags.some(t => t.toLowerCase().includes(q)));
      
      const matchesCategory = selectedCategory === 'all' || 
                             (prompt.category && prompt.category.toLowerCase() === selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [sortedPrompts, debouncedSearchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="h-20 bg-muted rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PromptCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold gradient-text">Galeria Pública</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore prompts compartilhados pela comunidade. Descubra, copie e use em seus projetos.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-lg py-2 px-4">
            {prompts.length} prompts públicos
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar na galeria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="popular">Mais Populares</SelectItem>
                <SelectItem value="alphabetical">Alfabética</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3",
                  viewMode === 'grid' && "bg-primary text-primary-foreground"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3",
                  viewMode === 'list' && "bg-primary text-primary-foreground"
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredPrompts.length} de {prompts.length} prompts
        </p>
      </div>

      {/* Prompts Grid/List */}
      {filteredPrompts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum prompt encontrado</h3>
              <p>Tente ajustar seus filtros de busca.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            : "space-y-4"
        )}>
          {filteredPrompts.map((prompt) => (
            <div key={prompt.id} className="relative group">
              <PromptCard
                prompt={prompt}
                onPreview={handlePreview}
                onToggleFavorite={() => {}}
                onCopy={handleCopy}
                onEdit={undefined}
                onDelete={undefined}
                loadPreview={() => {}}
                variant={viewMode}
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(prompt.id);
                }}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Compartilhar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <PromptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        prompt={selectedPrompt}
        onToggleFavorite={() => {}}
        onEdit={undefined}
        onDelete={undefined}
      />
    </div>
  );
}
