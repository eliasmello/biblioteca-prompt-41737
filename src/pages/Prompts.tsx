import { useState, useEffect } from "react";
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
import { PromptPreviewModal } from "@/components/prompts/PromptPreviewModal";
import ImportDialog from "@/components/prompts/ImportDialog";
import { usePrompts } from "@/hooks/usePrompts";
import { useToast } from "@/hooks/use-toast";
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
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types/prompt";

export default function Prompts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    prompts, 
    loading, 
    createPrompt, 
    updatePrompt, 
    deletePrompt, 
    importPrompts, 
    refetch 
  } = usePrompts();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Get unique categories from prompts
  const categories = [
    { value: "all", label: "Todas as Categorias" },
    ...Array.from(new Set(prompts.map(p => p.category)))
      .filter(Boolean)
      .map(cat => ({ value: cat.toLowerCase(), label: cat }))
  ];

  const handlePreview = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      setSelectedPrompt(prompt);
      setIsPreviewOpen(true);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      await updatePrompt(id, { isFavorite: !prompt.isFavorite });
      refetch();
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
      refetch();
    }
  };

  const handleImport = async (content: string) => {
    setIsImporting(true);
    try {
      await importPrompts(content);
      await refetch();
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

  const handleExport = () => {
    const exportData = filteredPrompts.map(prompt => ({
      title: prompt.title,
      category: prompt.category,
      subcategory: prompt.subcategory,
      content: prompt.content,
      description: prompt.description,
      number: prompt.number
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompts-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const sortedPrompts = [...prompts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.usageCount || 0) - (a.usageCount || 0);
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'favorites':
        return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const filteredPrompts = sortedPrompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (prompt.category && prompt.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           (prompt.category && prompt.category.toLowerCase() === selectedCategory);

    const matchesFavorites = !showFavoritesOnly || prompt.isFavorite;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando prompts...</p>
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
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <ImportDialog onImport={handleImport} isImporting={isImporting} />
          <Button 
            className="gap-2 bg-gradient-primary"
            onClick={() => navigate('/prompts/new')}
          >
            <Plus className="w-4 h-4" />
            Novo Prompt
          </Button>
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
                placeholder="Buscar prompts, categorias, conteúdo..."
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
                <SelectItem value="popular">Mais Usados</SelectItem>
                <SelectItem value="alphabetical">Alfabética</SelectItem>
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
          Mostrando {filteredPrompts.length} de {prompts.length} prompts
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
              onEdit={handleEdit}
              onDelete={handleDelete}
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