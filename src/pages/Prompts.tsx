import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageGeneration } from "@/hooks/useImageGeneration";
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
import { BatchImageGenerator } from "@/components/prompts/BatchImageGenerator";
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
  Hash,
  ArrowUp,
  Shuffle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types/prompt";
import { useDebounce } from "@/hooks/useDebounce";
import { SORT_OPTIONS } from "@/constants/prompts";

export default function Prompts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    personalPrompts,
    publicPrompts,
    loading,
    loadingMorePersonal,
    loadingMorePublic,
    loadingAll,
    hasMorePersonal,
    hasMorePublic,
    createPrompt, 
    updatePrompt, 
    deletePrompt, 
    importPrompts, 
    refetch,
    loadInitial,
    loadMore,
    loadAll,
    fetchPreviewImage,
    setPersonalPrompts,
    setPublicPrompts
  } = usePrompts();
  const { generateImage } = useImageGeneration();

  const isMaster = hasRole('master');

  // Get filter from URL or default to "todos"
  const filterFromUrl = searchParams.get('filtro') || 'todos';
  const [activeFilter, setActiveFilter] = useState<'todos' | 'meus' | 'favoritos' | 'publicos'>(
    filterFromUrl as 'todos' | 'meus' | 'favoritos' | 'publicos'
  );

  // Helper function to merge and deduplicate prompts by id
  const mergeAndDedupe = (...lists: Prompt[][]) => {
    const map = new Map<string, Prompt>();
    for (const list of lists) {
      for (const p of list) {
        if (!map.has(p.id)) map.set(p.id, p);
      }
    }
    return Array.from(map.values());
  };

  // Filtered prompts based on active tab
  const allPrompts = useMemo(() => {
    switch (activeFilter) {
      case 'meus':
        return personalPrompts;
      case 'publicos':
        return publicPrompts;
      case 'favoritos':
        return mergeAndDedupe(personalPrompts, publicPrompts).filter(p => p.isFavorite);
      case 'todos':
      default:
        return mergeAndDedupe(personalPrompts, publicPrompts);
    }
  }, [personalPrompts, publicPrompts, activeFilter]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'random' | 'newest' | 'oldest' | 'title' | 'category' | 'usage' | 'favorites' | 'numberAsc' | 'numberDesc'>('random');
  const [minNumber, setMinNumber] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [goToNumber, setGoToNumber] = useState<string>("");
  const [shuffleKey, setShuffleKey] = useState(0);

  // Update URL when filter changes
  useEffect(() => {
    if (activeFilter !== 'todos') {
      setSearchParams({ filtro: activeFilter });
    } else {
      setSearchParams({});
    }
  }, [activeFilter, setSearchParams]);

  // Força embaralhamento inicial ao montar
  useEffect(() => {
    setShuffleKey(k => k + 1);
  }, []);

  useSEO({
    title: "Prompts de IA - Biblioteca do Sistema",
    description: "Explore nossa biblioteca de prompts de IA organizados por categoria. Prompts oficiais do sistema para arte, negócios, desenvolvimento e muito mais."
  });

  // Load initial prompts on mount
  useEffect(() => {
    if (user) {
      loadInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Get unique categories from allPrompts (alphabetically sorted)
  const categories = [
    { value: "all", label: "Todas as Categorias" },
    ...(() => {
      const byValue = new Map<string, string>();
      for (const p of allPrompts) {
        if (!p.category) continue;
        const val = p.category.trim().toLowerCase();
        if (!byValue.has(val)) byValue.set(val, p.category.trim());
      }
      return Array.from(byValue.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    })()
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

  const handleGenerateImage = async (id: string, content: string) => {
    // Debug logs
    console.log(`🔍 [DEBUG] Gerando imagem para prompt ID: ${id}`);
    console.log(`📝 [DEBUG] Content length: ${content?.length || 0}`);
    console.log(`📝 [DEBUG] Content preview: ${content?.substring(0, 100) || 'VAZIO'}`);
    
    if (!content || !content.trim()) {
      console.error(`❌ [ERROR] Content vazio para prompt ${id}`);
      
      // Buscar o prompt completo do estado
      const fullPrompt = allPrompts.find(p => p.id === id);
      console.log(`📋 [DEBUG] Prompt completo:`, fullPrompt);
      
      toast({
        title: "Conteúdo vazio",
        description: "O prompt precisa ter conteúdo para gerar uma imagem.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImageId(id);
    try {
      const result = await generateImage(content, id);
      
      if (result) {
        // Update local state IMMEDIATELY for instant UI feedback
        setPersonalPrompts(prev => 
          prev.map(p => p.id === id ? { 
            ...p, 
            previewImage: result.imageUrl,
            thumbnailUrl: result.thumbnailUrl,
            preview_image: result.imageUrl,
            thumbnail_url: result.thumbnailUrl
          } : p)
        );
        setPublicPrompts(prev => 
          prev.map(p => p.id === id ? { 
            ...p, 
            previewImage: result.imageUrl,
            thumbnailUrl: result.thumbnailUrl,
            preview_image: result.imageUrl,
            thumbnail_url: result.thumbnailUrl
          } : p)
        );
        
        toast({
          title: "Imagem gerada! ✨",
          description: "A imagem foi gerada e atualizada com sucesso.",
        });
        
        // Sync with database SEQUENTIALLY after edge function completes
        setTimeout(async () => {
          await refetch(true);
          await refetch(false);
        }, 800);
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: "Erro ao gerar imagem",
        description: "Não foi possível gerar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImageId(null);
    }
  };


  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const sortedPrompts = useMemo(() => {
    const sorted = [...allPrompts];
    
    if (sortBy === 'random') {
      // Shuffle aleatório usando algoritmo Fisher-Yates
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;
    }
    
    return sorted.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
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
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allPrompts, sortBy, shuffleKey]);

  const filteredPrompts = useMemo(() => {
    // Calcula distância de Levenshtein para busca fuzzy
    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix: number[][] = [];
      
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[str2.length][str1.length];
    };

    // Função auxiliar para buscar por início de palavra com fuzzy
    const searchByWords = (text: string, query: string): boolean => {
      if (!text || !query) return false;
      const textWords = text.toLowerCase().split(/\s+/);
      const queryWords = query.toLowerCase().trim().split(/\s+/);
      
      // Cada palavra da query precisa ter match no texto
      return queryWords.every(queryWord => {
        // Primeiro tenta match exato por início de palavra
        const exactMatch = textWords.some(textWord => textWord.startsWith(queryWord));
        if (exactMatch) return true;
        
        // Se não encontrar exato, tenta fuzzy (tolera até 2 caracteres de diferença)
        const maxDistance = Math.min(2, Math.floor(queryWord.length / 3));
        return textWords.some(textWord => {
          // Só compara com palavras de tamanho similar
          if (Math.abs(textWord.length - queryWord.length) > maxDistance) return false;
          return levenshteinDistance(textWord, queryWord) <= maxDistance;
        });
      });
    };

    const filtered = sortedPrompts.filter(prompt => {
      const q = debouncedSearchQuery.toLowerCase();
      const matchesSearch = debouncedSearchQuery === '' || 
                           searchByWords(prompt.title, q) ||
                           searchByWords(prompt.content, q) ||
                           (prompt.category && searchByWords(prompt.category, q)) ||
                           (prompt.tags && prompt.tags.some(t => searchByWords(t, q))) ||
                           (prompt.keywords && prompt.keywords.some(t => searchByWords(t, q))) ||
                           (prompt.styleTags && prompt.styleTags.some(t => searchByWords(t, q))) ||
                           (prompt.subjectTags && prompt.subjectTags.some(t => searchByWords(t, q)));
      
      const matchesCategory = selectedCategory === 'all' || 
                             (prompt.category && prompt.category.toLowerCase() === selectedCategory);

      const matchesMinNumber = !minNumber || (typeof prompt.number === 'number' && prompt.number >= Number(minNumber));
  
      return matchesSearch && matchesCategory && matchesMinNumber;
    });
    
    // Deduplicação defensiva final por ID
    const deduped = new Map<string, Prompt>();
    for (const p of filtered) {
      if (!deduped.has(p.id)) deduped.set(p.id, p);
    }
    return Array.from(deduped.values());
  }, [sortedPrompts, debouncedSearchQuery, selectedCategory, minNumber]);

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
            Explore e gerencie seus prompts de IA
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isMaster && (
            <>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => navigate('/categories')}
              >
                <Settings className="w-4 h-4" />
                Categorias
              </Button>
              <ImportDialog onImport={handleImport} isImporting={isImporting} />
              <BatchImageGenerator 
                missingImagesCount={allPrompts.filter(p => !p.previewImage && !p.preview_image).length}
                onComplete={async () => {
                  await refetch(true);
                  await refetch(false);
                }}
              />
            </>
          )}
          <ExportDialog prompts={filteredPrompts} defaultFilename="prompts">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </ExportDialog>
          {user && (
            <Button 
              className="gap-2 bg-gradient-primary"
              onClick={() => navigate('/prompts/new')}
            >
              <Plus className="w-4 h-4" />
              Novo Prompt
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="meus">Meus Prompts</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
          <TabsTrigger value="publicos">Públicos</TabsTrigger>
        </TabsList>
      </Tabs>

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
                title="Este filtro oculta números menores"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-[150px]">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                <SelectItem value="numberAsc">Numeração (crescente)</SelectItem>
                <SelectItem value="numberDesc">Numeração (decrescente)</SelectItem>
                <SelectItem value="favorites">Favoritos</SelectItem>
              </SelectContent>
            </Select>

            {/* Shuffle Button */}
            {sortBy === 'random' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShuffleKey(k => k + 1)}
                className="gap-2"
                title="Embaralhar ordem"
              >
                <Shuffle className="w-4 h-4" />
                Embaralhar
              </Button>
            )}

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

          {/* Navigation controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Button
              variant="outline"
              onClick={async () => {
                toast({
                  title: "Carregando todos os prompts...",
                  description: "Isso pode levar alguns segundos",
                });
                
                if (activeFilter === 'todos') {
                  await loadAll(true);  // Carregar "meus"
                  await loadAll(false); // Carregar "públicos"
                } else if (activeFilter === 'meus') {
                  await loadAll(true);
                } else if (activeFilter === 'publicos') {
                  await loadAll(false);
                }
                
                toast({
                  title: "Todos os prompts carregados!",
                });
              }}
              disabled={loadingAll}
              className="w-full"
            >
              {loadingAll ? "Carregando..." : "Carregar todos"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full"
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Voltar ao topo
            </Button>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Nº do prompt"
                value={goToNumber}
                onChange={(e) => setGoToNumber(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const num = parseInt(goToNumber);
                    if (isNaN(num)) {
                      toast({
                        title: "Número inválido",
                        description: "Por favor, insira um número válido",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Tentar encontrar primeiro
                    let element = document.querySelector(`[data-prompt-number="${num}"]`);
                    
                    if (!element) {
                      // Salvar filtros atuais
                      const prevSearch = searchQuery;
                      const prevCategory = selectedCategory;
                      const prevMinNum = minNumber;
                      const prevSort = sortBy;
                      
                      // Limpar filtros temporariamente
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setMinNumber("");
                      setSortBy("numberAsc");
                      
                      toast({
                        title: "Carregando todos os prompts...",
                        description: "Buscando prompt #" + num,
                      });
                      
                      // Carregar todos os prompts
                      if (activeFilter === 'todos') {
                        await loadAll(true);
                        await loadAll(false);
                      } else if (activeFilter === 'meus') {
                        await loadAll(true);
                      } else if (activeFilter === 'publicos') {
                        await loadAll(false);
                      } else if (activeFilter === 'favoritos') {
                        await loadAll(true);
                        await loadAll(false);
                      }
                      
                      // Aguardar re-renderização
                      await new Promise(resolve => setTimeout(resolve, 300));
                      element = document.querySelector(`[data-prompt-number="${num}"]`);
                      
                      // Restaurar filtros se não encontrou
                      if (!element) {
                        setSearchQuery(prevSearch);
                        setSelectedCategory(prevCategory);
                        setMinNumber(prevMinNum);
                        setSortBy(prevSort);
                      }
                    }

                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "center" });
                      setGoToNumber("");
                      
                      // Destacar elemento
                      element.classList.add("ring-2", "ring-primary", "ring-offset-2");
                      setTimeout(() => {
                        element?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
                      }, 2000);
                      
                      toast({
                        title: "Prompt #" + num + " encontrado!",
                      });
                    } else {
                      toast({
                        title: "Prompt não encontrado",
                        description: "O prompt #" + num + " não existe",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={async () => {
                  const num = parseInt(goToNumber);
                  if (isNaN(num)) {
                    toast({
                      title: "Número inválido",
                      description: "Por favor, insira um número válido",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Tentar encontrar primeiro
                  let element = document.querySelector(`[data-prompt-number="${num}"]`);
                  
                  if (!element) {
                    // Salvar filtros atuais
                    const prevSearch = searchQuery;
                    const prevCategory = selectedCategory;
                    const prevMinNum = minNumber;
                    const prevSort = sortBy;
                    
                    // Limpar filtros temporariamente
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setMinNumber("");
                    setSortBy("numberAsc");
                    
                    toast({
                      title: "Carregando todos os prompts...",
                      description: "Buscando prompt #" + num,
                    });
                    
                    // Carregar todos os prompts
                    if (activeFilter === 'todos') {
                      await loadAll(true);
                      await loadAll(false);
                    } else if (activeFilter === 'meus') {
                      await loadAll(true);
                    } else if (activeFilter === 'publicos') {
                      await loadAll(false);
                    } else if (activeFilter === 'favoritos') {
                      await loadAll(true);
                      await loadAll(false);
                    }
                    
                    // Aguardar re-renderização
                    await new Promise(resolve => setTimeout(resolve, 300));
                    element = document.querySelector(`[data-prompt-number="${num}"]`);
                    
                    // Restaurar filtros se não encontrou
                    if (!element) {
                      setSearchQuery(prevSearch);
                      setSelectedCategory(prevCategory);
                      setMinNumber(prevMinNum);
                      setSortBy(prevSort);
                    }
                  }

                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    setGoToNumber("");
                    
                    // Destacar elemento
                    element.classList.add("ring-2", "ring-primary", "ring-offset-2");
                    setTimeout(() => {
                      element?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
                    }, 2000);
                    
                    toast({
                      title: "Prompt #" + num + " encontrado!",
                    });
                  } else {
                    toast({
                      title: "Prompt não encontrado",
                      description: "O prompt #" + num + " não existe",
                      variant: "destructive",
                    });
                  }
                }} 
                variant="outline"
              >
                Ir
              </Button>
              <Button 
                onClick={async () => {
                  setGoToNumber("1");
                  
                  // Tentar encontrar primeiro
                  let element = document.querySelector(`[data-prompt-number="1"]`);
                  
                  if (!element) {
                    // Salvar filtros atuais
                    const prevSearch = searchQuery;
                    const prevCategory = selectedCategory;
                    const prevMinNum = minNumber;
                    const prevSort = sortBy;
                    
                    // Limpar filtros temporariamente
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setMinNumber("");
                    setSortBy("numberAsc");
                    
                    toast({
                      title: "Carregando todos os prompts...",
                      description: "Buscando prompt #1",
                    });
                    
                    // Carregar todos os prompts
                    if (activeFilter === 'todos') {
                      await loadAll(true);
                      await loadAll(false);
                    } else if (activeFilter === 'meus') {
                      await loadAll(true);
                    } else if (activeFilter === 'publicos') {
                      await loadAll(false);
                    } else if (activeFilter === 'favoritos') {
                      await loadAll(true);
                      await loadAll(false);
                    }
                    
                    // Aguardar re-renderização
                    await new Promise(resolve => setTimeout(resolve, 300));
                    element = document.querySelector(`[data-prompt-number="1"]`);
                    
                    // Restaurar filtros se não encontrou
                    if (!element) {
                      setSearchQuery(prevSearch);
                      setSelectedCategory(prevCategory);
                      setMinNumber(prevMinNum);
                      setSortBy(prevSort);
                    }
                  }

                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    setGoToNumber("");
                    
                    // Destacar elemento
                    element.classList.add("ring-2", "ring-primary", "ring-offset-2");
                    setTimeout(() => {
                      element?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
                    }, 2000);
                    
                    toast({
                      title: "Prompt #1 encontrado!",
                    });
                  } else {
                    toast({
                      title: "Prompt não encontrado",
                      description: "O prompt #1 não existe",
                      variant: "destructive",
                    });
                  }
                }} 
                variant="outline"
                size="icon"
                title="Ir para o prompt #1"
              >
                #1
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
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredPrompts.length} prompts
        </p>
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
        <>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} data-prompt-number={prompt.number}>
                <PromptCard
                  prompt={prompt}
                  onPreview={handlePreview}
                  onToggleFavorite={handleToggleFavorite}
                  onCopy={handleCopy}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onGenerateImage={handleGenerateImage}
                  isGeneratingImage={generatingImageId === prompt.id}
                  loadPreview={fetchPreviewImage}
                  variant={viewMode}
                />
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {((activeFilter === 'meus' || activeFilter === 'todos') && hasMorePersonal) || 
           ((activeFilter === 'publicos' || activeFilter === 'todos') && hasMorePublic) ? (
            <div className="flex justify-center mt-8">
              {activeFilter === 'meus' && hasMorePersonal && (
                <Button
                  onClick={() => loadMore(true)}
                  disabled={loadingMorePersonal}
                  variant="outline"
                  size="lg"
                >
                  {loadingMorePersonal ? 'Carregando...' : 'Carregar mais'}
                </Button>
              )}
              {activeFilter === 'publicos' && hasMorePublic && (
                <Button
                  onClick={() => loadMore(false)}
                  disabled={loadingMorePublic}
                  variant="outline"
                  size="lg"
                >
                  {loadingMorePublic ? 'Carregando...' : 'Carregar mais'}
                </Button>
              )}
              {activeFilter === 'todos' && (hasMorePersonal || hasMorePublic) && (
                <Button
                  onClick={() => {
                    if (hasMorePersonal) loadMore(true);
                    if (hasMorePublic) loadMore(false);
                  }}
                  disabled={loadingMorePersonal || loadingMorePublic}
                  variant="outline"
                  size="lg"
                >
                  {(loadingMorePersonal || loadingMorePublic) ? 'Carregando...' : 'Carregar mais'}
                </Button>
              )}
            </div>
          ) : null}
        </>
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