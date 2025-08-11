import { useMemo, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/prompts/PromptCard";
import PromptCardSkeleton from "@/components/prompts/PromptCardSkeleton";
import { PromptPreviewModal } from "@/components/prompts/PromptPreviewModal";
import { usePrompts } from "@/hooks/usePrompts";
import { Prompt } from "@/types/prompt";
import { Upload } from "lucide-react";

export default function Favorites() {
  const { prompts, loading, updatePrompt, deletePrompt, fetchPreviewImage } = usePrompts();
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useSEO({
    title: "Favoritos — Prompts favoritados",
    description: "Veja apenas seus prompts marcados como favoritos.",
    canonicalPath: "/favorites",
  });

  const favorites = useMemo(() => prompts.filter((p) => p.isFavorite), [prompts]);

  const handlePreview = (id: string) => {
    const p = favorites.find((x) => x.id === id) || null;
    setSelectedPrompt(p);
    setIsPreviewOpen(!!p);
  };

  const handleToggleFavorite = async (id: string) => {
    const p = prompts.find((x) => x.id === id);
    if (p) await updatePrompt(id, { isFavorite: !p.isFavorite }, { silent: true });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleEdit = (id: string) => {
    // Navegação é controlada pelo PromptCard através do clique no card/edição
    window.location.href = `/prompts/edit/${id}`;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este prompt?")) {
      await deletePrompt(id);
    }
  };

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Favoritos</h1>
          <p className="text-muted-foreground mt-1">Veja apenas seus prompts favoritos</p>
        </div>
      </header>

      {loading ? (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PromptCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ) : favorites.length === 0 ? (
        <section>
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-medium mb-2">Nenhum favorito encontrado</h2>
                <p>Marque prompts como favoritos na página de Prompts para vê-los aqui.</p>
                <Button className="mt-4 bg-gradient-primary" onClick={() => (window.location.href = '/prompts')}>
                  Ir para Prompts
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section aria-label="Lista de prompts favoritos">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Mostrando {favorites.length} favoritos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {favorites.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onPreview={handlePreview}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loadPreview={fetchPreviewImage}
                variant="grid"
              />
            ))}
          </div>
        </section>
      )}

      <PromptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        prompt={selectedPrompt}
        onToggleFavorite={handleToggleFavorite}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
