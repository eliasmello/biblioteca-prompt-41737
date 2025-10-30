import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Clock } from 'lucide-react';
import PromptForm from '@/components/prompts/PromptForm';
import { VersionHistoryDialog } from '@/components/prompts/VersionHistoryDialog';
import { usePrompts } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';
import { Prompt } from '@/types/prompt';

export default function PromptEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { createPrompt, updatePrompt, getPromptById } = usePrompts();
  
  const [prompt, setPrompt] = useState<Prompt | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(!!id);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (!isEditing || !id) return;

    let isMounted = true;
    setIsFetchingPrompt(true);
    
    (async () => {
      const fetched = await getPromptById(id);
      if (!isMounted) return;
      
      if (fetched) {
        setPrompt(fetched);
      } else {
        toast({
          title: "Erro",
          description: "Prompt não encontrado.",
          variant: "destructive",
        });
        navigate('/prompts');
      }
      setIsFetchingPrompt(false);
    })();

    return () => { isMounted = false; };
  }, [id, isEditing, getPromptById, toast, navigate]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (isEditing && prompt) {
        await updatePrompt(prompt.id, data, { silent: true });
        // Sem toast de sucesso no editor; confirmação fica apenas no card
      } else {
        await createPrompt(data);
        toast({
          title: "Sucesso!",
          description: "Prompt criado com sucesso.",
        });
      }
      navigate('/prompts');
    } catch (error) {
      const errMsg = (error as any)?.message ? String((error as any).message) : String(error);
      toast({
        title: "Erro",
        description: /permission/i.test(errMsg)
          ? "Você não tem permissão para editar este prompt."
          : (isEditing ? "Erro ao atualizar prompt." : "Erro ao criar prompt."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/prompts');
  };

  // Renderiza skeleton apenas enquanto busca o prompt específico
  if (isFetchingPrompt) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Form skeleton */}
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/prompts')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              {isEditing ? 'Editar Prompt' : 'Novo Prompt'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing 
                ? 'Faça as alterações necessárias no seu prompt' 
                : 'Crie um novo prompt para sua coleção'
              }
            </p>
          </div>
        </div>
        
        {isEditing && prompt && (
          <Button
            variant="outline"
            onClick={() => setShowVersionHistory(true)}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Ver Histórico
          </Button>
        )}
      </div>

      {/* Form */}
      <PromptForm
        prompt={prompt}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />

      {/* Version History Dialog */}
      {isEditing && prompt && (
        <VersionHistoryDialog
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          promptId={prompt.id}
          currentVersion={{
            title: prompt.title,
            content: prompt.content,
            category: prompt.category,
            subcategory: prompt.subcategory,
          }}
          onVersionRestored={() => {
            // Recarregar o prompt após restaurar versão
            getPromptById(prompt.id).then(fetched => {
              if (fetched) setPrompt(fetched);
            });
          }}
        />
      )}
    </div>
  );
}