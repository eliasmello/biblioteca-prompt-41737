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
import ImportDialog from "@/components/prompts/ImportDialog";
import ExportDialog from "@/components/prompts/ExportDialog";
import { usePrompts } from "@/hooks/usePrompts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import {
  Search,
  Plus,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Star,
  Download,
  Upload,
  Settings,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types/prompt";
import { useDebounce } from "@/hooks/useDebounce";

export default function Prompts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const { 
    personalPrompts,
    publicPrompts,
    loading, 
    createPrompt, 
    updatePrompt, 
    deletePrompt, 
    importPrompts, 
    refetch,
    fetchPreviewImage
  } = usePrompts();

  // Combine personal and public prompts
  const allPrompts = useMemo(() => {
    return [...personalPrompts, ...publicPrompts];
  }, [personalPrompts, publicPrompts]);

  const isMaster = hasRole('master');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem('prompts.sortBy') || 'numberAsc';
    } catch {
      return 'numberAsc';
    }
  });
  const [minNumber, setMinNumber] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('prompts.sortBy', sortBy);
    } catch {}
  }, [sortBy]);

  useSEO({
    title: "Prompts de IA - Biblioteca do Sistema",
    description: "Explore nossa biblioteca de prompts de IA organizados por categoria. Prompts oficiais do sistema para arte, negócios, desenvolvimento e muito mais."
  });

  // Fetch all prompts (personal + public)
  useEffect(() => {
    if (user) {
      refetch(true);  // Fetch personal prompts
      refetch(false); // Fetch public prompts
    }
  }, [user, refetch]);

  // Get unique categories from allPrompts (alphabetically sorted)
  const categories = [
    { value: "all", label: "Todas as Categorias" },
    ...Array.from(new Set(allPrompts.map(p => p.category)))
      .filter(Boolean)
      .map(cat => ({ value: cat.toLowerCase(), label: cat }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ];

  const handlePreview = (id: string) => {
    const prompt = allPrompts.find(p => p.id === id);
    if (prompt) {
      setSelectedPrompt(prompt);
      setIsPreviewOpen(true);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const prompt = allPrompts.find(p => p.id === id);
    if (prompt) {
      await updatePrompt(id, { isFavorite: !prompt.isFavorite });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado!",
      description: "Prompt copiado para a área de transferência.",
    });
  };

  const handleEdit = (id: string) => {
    navigate(`/prompts/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este prompt?')) {
      await deletePrompt(id);
    }
  };

  const handleImport = async (content: string) => {
    setIsImporting(true);
    try {
      await importPrompts(content);
      toast({
        title: "Sucesso!",
        description: "Prompts importados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao importar prompts.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };


  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const sortedPrompts = useMemo(() => {
    return [...allPrompts].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'favorites':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        case 'numberAsc': {
          const aNum = a.number;
          const bNum = b.number;
          if (aNum == null && bNum == null) return 0;
          if (aNum == null) return 1;
          if (bNum == null) return -1;
          return aNum - bNum;
        }
        case 'numberDesc': {
          const aNum = a.number;
          const bNum = b.number;
          if (aNum == null && bNum == null) return 0;
          if (aNum == null) return 1;
          if (bNum == null) return -1;
          return bNum - aNum;
        }
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allPrompts, sortBy]);

  const filteredPrompts = useMemo(() => {
    return sortedPrompts.filter(prompt => {
      const q = debouncedSearchQuery.toLowerCase();
      const matchesSearch = debouncedSearchQuery === '' || 
                           prompt.title.toLowerCase().includes(q) ||
                           prompt.content.toLowerCase().includes(q) ||
                           (prompt.category && prompt.category.toLowerCase().includes(q)) ||
                           (prompt.tags && prompt.tags.some(t => t.toLowerCase().includes(q))) ||
                           (prompt.keywords && prompt.keywords.some(t => t.toLowerCase().includes(q))) ||
                           (prompt.styleTags && prompt.styleTags.some(t => t.toLowerCase().includes(q))) ||
                           (prompt.subjectTags && prompt.subjectTags.some(t => t.toLowerCase().includes(q)));
      
      const matchesCategory = selectedCategory === 'all' || 
                             (prompt.category && prompt.category.toLowerCase() === selectedCategory);
  
      const matchesFavorites = !showFavoritesOnly || prompt.isFavorite;

      const matchesMinNumber = !minNumber || (typeof prompt.number === 'number' && prompt.number >= Number(minNumber));
  
      return matchesSearch && matchesCategory && matchesFavorites && matchesMinNumber;
    });
  }, [sortedPrompts, debouncedSearchQuery, selectedCategory, showFavoritesOnly, minNumber]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Filter skeleton */}
        <div className="h-20 bg-muted rounded-lg animate-pulse"></div>

        {/* Grid skeleton */}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Prompts</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e organize seus prompts de IA
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/categories')}
          >
            <Settings className="w-4 h-4" />
            Categorias
          </Button>
          <ExportDialog prompts={filteredPrompts} defaultFilename="prompts">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </ExportDialog>
          {isMaster && (
            <>
              <ImportDialog onImport={handleImport} isImporting={isImporting} />
              <Button 
                className="gap-2 bg-gradient-primary"
                onClick={() => navigate('/prompts/new')}
              >
                <Plus className="w-4 h-4" />
                Novo Prompt
              </Button>
            </>
          )}
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
                placeholder="Buscar prompts, categorias, conteúdo e tags..."
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

            {/* Min Number Filter */}
            <div className="relative w-[180px]">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="number"
                min={0}
                placeholder="A partir do nº"
                value={minNumber}
                onChange={(e) => setMinNumber(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="popular">Mais Usados</SelectItem>
                <SelectItem value="alphabetical">Alfabética</SelectItem>
                <SelectItem value="numberAsc">Numeração (crescente)</SelectItem>
                <SelectItem value="numberDesc">Numeração (decrescente)</SelectItem>
                <SelectItem value="favorites">Favoritos</SelectItem>
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

          {/* Active Filters */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Busca: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1">×</button>
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Categoria: {categories.find(c => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory('all')} className="ml-1">×</button>
              </Badge>
            )}
            {minNumber && (
              <Badge variant="secondary" className="gap-1">
                A partir do nº: {minNumber}
                <button onClick={() => setMinNumber('')} className="ml-1">×</button>
              </Badge>
            )}
            {showFavoritesOnly && (
              <Badge variant="secondary" className="gap-1">
                Apenas Favoritos
                <button onClick={() => setShowFavoritesOnly(false)} className="ml-1">×</button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredPrompts.length} de {allPrompts.length} prompts
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />
          {showFavoritesOnly ? 'Mostrar todos' : 'Apenas favoritos'}
        </Button>
      </div>

      {/* Prompts Grid/List */}
      {filteredPrompts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum prompt encontrado</h3>
              <p>Comece criando um novo prompt ou importe prompts existentes.</p>
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
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onPreview={handlePreview}
              onToggleFavorite={handleToggleFavorite}
              onCopy={handleCopy}
              onEdit={undefined}
              onDelete={undefined}
              loadPreview={fetchPreviewImage}
              variant={viewMode}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <PromptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        prompt={selectedPrompt}
        onToggleFavorite={handleToggleFavorite}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}