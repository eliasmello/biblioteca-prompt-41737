import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { usePrompts } from "@/hooks/usePrompts";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  FolderOpen,
  Star,
  TrendingUp,
  Plus,
  Search,
  Sparkles,
  Activity,
  Users,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { personalPrompts, loading, updatePrompt, refetch } = usePrompts();
  const { generateImage } = useImageGeneration();
  const { toast } = useToast();
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  
  // Use personal prompts on dashboard (user's own prompts)
  const prompts = personalPrompts;

  useEffect(() => {
    if (user) {
      refetch(true); // Fetch personal prompts
    }
  }, [user, refetch]);

  useSEO({
    title: "Dashboard — Visão geral de prompts",
    description: "Resumo dos prompts cadastrados: total, favoritos, categorias e recentes.",
    canonicalPath: "/dashboard",
  });

  const totalPrompts = prompts.length;
  const categoriesSet = new Set((prompts || []).map(p => p.category).filter(Boolean));
  const categoriesCount = categoriesSet.size;
  const favoritesCount = (prompts || []).filter(p => p.isFavorite).length;
  const totalUsage = (prompts || []).reduce((sum, p) => sum + (p.usageCount || 0), 0);

  const stats = useMemo(() => ([
    {
      title: "Total de Prompts",
      value: String(totalPrompts),
      change: "",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Categorias",
      value: String(categoriesCount),
      change: "",
      icon: FolderOpen,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "Favoritos",
      value: String(favoritesCount),
      change: "",
      icon: Star,
      color: "text-favorite",
      bgColor: "bg-favorite/10"
    },
    {
      title: "Total de Usos",
      value: String(totalUsage),
      change: "",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    }
  ]), [totalPrompts, categoriesCount, favoritesCount, totalUsage]);

  const recentPrompts = useMemo(() => {
    return [...prompts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        category: p.category || 'Geral',
        usageCount: p.usageCount || 0,
        createdAt: p.createdAt,
        tags: [...(p.styleTags || []), ...(p.subjectTags || [])].slice(0, 3)
      }));
  }, [prompts]);

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of prompts) {
      const cat = p.category || 'Geral';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    const colors = ["bg-primary", "bg-accent", "bg-secondary", "bg-muted-foreground"]; // design tokens
    return Array.from(counts.entries())
      .map(([name, count], idx) => ({ name, count, color: colors[idx % colors.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [prompts]);

  const maxCategoryCount = useMemo(() => Math.max(1, ...topCategories.map(c => c.count)), [topCategories]);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo! Veja o que está acontecendo com seus prompts.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/prompts')}>
            <Search className="w-4 h-4" />
            Ver Prompts
          </Button>
          <Button className="gap-2 bg-gradient-primary" onClick={() => navigate('/prompts/new')}>
            <Plus className="w-4 h-4" />
            Novo Prompt
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p className="text-sm text-success mt-1">
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Prompts */}
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Prompts Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">
                        {prompt.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {prompt.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {prompt.usageCount} uses • {new Date(prompt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateImage(prompt.id, prompt.title);
                    }}
                    disabled={generatingImageId === prompt.id}
                    title="Gerar imagem com IA"
                  >
                    {generatingImageId === prompt.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Principais Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category) => (
                <div key={category.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {category.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {category.count}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${category.color}`}
                        style={{ width: `${(category.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/prompts/new')}>
              <Plus className="w-6 h-6" />
              Criar Novo Prompt
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/categories')}>
              <FolderOpen className="w-6 h-6" />
              Gerenciar Categorias
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/prompts')}>
              <FileText className="w-6 h-6" />
              Importar Prompts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}