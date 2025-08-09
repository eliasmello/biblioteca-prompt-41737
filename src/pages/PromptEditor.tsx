import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import PromptForm from '@/components/prompts/PromptForm';
import { usePrompts } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';
import { Prompt } from '@/types/prompt';

export default function PromptEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { prompts, createPrompt, updatePrompt, loading, fetchPreviewImage } = usePrompts();
  
  const [prompt, setPrompt] = useState<Prompt | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && prompts.length > 0) {
      const foundPrompt = prompts.find(p => p.id === id);
      if (foundPrompt) {
        setPrompt(foundPrompt);
        if (!foundPrompt.previewImage) {
          fetchPreviewImage(foundPrompt.id);
        }
      } else {
        toast({
          title: "Erro",
          description: "Prompt não encontrado.",
          variant: "destructive",
        });
        navigate('/prompts');
      }
    }
  }, [id, prompts, isEditing, toast, navigate, fetchPreviewImage]);

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
      toast({
        title: "Erro",
        description: isEditing ? "Erro ao atualizar prompt." : "Erro ao criar prompt.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/prompts');
  };

  if (loading) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
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

      {/* Form */}
      <PromptForm
        prompt={prompt}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}