import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrompts } from "@/hooks/usePrompts";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromptCard } from "@/components/prompts/PromptCard";
import PromptCardSkeleton from "@/components/prompts/PromptCardSkeleton";
import CategorySelect from "@/components/prompts/CategorySelect";
import ImportDialog from "@/components/prompts/ImportDialog";
import ExportDialog from "@/components/prompts/ExportDialog";
import { Search, Plus, FileText, Import, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

export default function MyPrompts() {
  const { user } = useAuth();
  const { personalPrompts, loading, refetch, importPrompts, updatePrompt, deletePrompt } = usePrompts();
  const { generateImage } = useImageGeneration();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical" | "usage">("recent");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useSEO({
    title: "Meus Prompts",
    description: "Gerencie seus prompts pessoais - crie, edite e organize seus próprios prompts."
  });

  // Fetch only user's personal prompts on mount
  useEffect(() => {
    if (user) {
      refetch(true); // true = personalOnly
    }
  }, [user, refetch]);

  // Use only personal prompts for this page
  const myPrompts = personalPrompts;

  // Get unique categories from user's prompts
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    myPrompts.forEach(prompt => {
      if (prompt.category) {
        categorySet.add(prompt.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [myPrompts]);

  const sortedPrompts = useMemo(() => {
    const filtered = [...myPrompts];
    
    switch (sortBy) {
      case "alphabetical":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "usage":
        return filtered.sort((a, b) => (b.usageCount || b.usage_count || 0) - (a.usageCount || a.usage_count || 0));
      case "recent":
      default:
        return filtered.sort((a, b) => 
          new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at).getTime() - 
          new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at).getTime()
        );
    }
  }, [myPrompts, sortBy]);

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
      
      return matchesSearch && matchesCategory;
    });
  }, [sortedPrompts, debouncedSearchQuery, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === 'Todas as Categorias' ? 'all' : category.toLowerCase());
  };

  const handleImport = async (content: string) => {
    setIsImporting(true);
    try {
      await importPrompts(content);
      refetch(true); // Recarregar apenas prompts pessoais
      setShowImportDialog(false);
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

  const handleToggleFavorite = async (id: string) => {
    const prompt = personalPrompts.find(p => p.id === id);
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

  const handleGenerateImage = async (id: string, content: string) => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo vazio",
        description: "O prompt precisa ter conteúdo para gerar uma imagem.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImageId(id);
    try {
      const imageUrl = await generateImage(content);
      
      if (imageUrl) {
        await updatePrompt(id, { previewImage: imageUrl });
        await refetch(true);
        toast({
          title: "Imagem gerada! ✨",
          description: "A imagem foi gerada e atualizada com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
    } finally {
      setGeneratingImageId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <PromptCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Meus Prompts</h1>
          <Badge variant="outline">{myPrompts.length}</Badge>
        </div>
        
        <div className="flex gap-2">
          <ExportDialog prompts={filteredPrompts} defaultFilename="meus-prompts">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </ExportDialog>
          <Button onClick={() => setShowImportDialog(true)} variant="outline">
            <Import className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button asChild>
            <Link to="/prompts/new">
              <Plus className="h-4 w-4 mr-2" />
              Criar Prompt
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar seus prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <Select value={selectedCategory === 'all' ? 'Todas as Categorias' : selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas as Categorias">Todas as Categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: "recent" | "alphabetical" | "usage") => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais Recentes</SelectItem>
                  <SelectItem value="alphabetical">Alfabética</SelectItem>
                  <SelectItem value="usage">Mais Usados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {myPrompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Nenhum prompt pessoal encontrado</CardTitle>
            <CardDescription className="mb-4 max-w-md">
              Este é seu espaço para publicar e organizar seus posts pessoais.
            </CardDescription>
            <div className="flex gap-2">
              <Button onClick={() => setShowImportDialog(true)} variant="outline">
                <Import className="h-4 w-4 mr-2" />
                Importar Prompts
              </Button>
              <Button asChild>
                <Link to="/prompts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Prompt
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Nenhum prompt encontrado</CardTitle>
            <CardDescription>
              Tente ajustar seus filtros de busca ou categoria para encontrar seus prompts.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        /* Prompts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt}
              onPreview={() => {}}
              onToggleFavorite={handleToggleFavorite}
              onCopy={handleCopy}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={generatingImageId === prompt.id}
              loadPreview={() => {}}
            />
          ))}
        </div>
      )}

      {/* Import Dialog */}
      <ImportDialog 
        onImport={handleImport}
        isImporting={isImporting}
      />
    </div>
  );
}