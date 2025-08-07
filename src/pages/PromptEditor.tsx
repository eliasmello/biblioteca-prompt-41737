import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PromptForm from '@/components/prompts/PromptForm';
import { usePrompts } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';
import { Prompt } from '@/types/prompt';

export default function PromptEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { prompts, createPrompt, updatePrompt, loading } = usePrompts();
  
  const [prompt, setPrompt] = useState<Prompt | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && prompts.length > 0) {
      const foundPrompt = prompts.find(p => p.id === id);
      if (foundPrompt) {
        setPrompt(foundPrompt);
      } else {
        toast({
          title: "Erro",
          description: "Prompt não encontrado.",
          variant: "destructive",
        });
        navigate('/prompts');
      }
    }
  }, [id, prompts, isEditing, toast, navigate]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (isEditing && prompt) {
        await updatePrompt(prompt.id, data);
        toast({
          title: "Sucesso!",
          description: "Prompt atualizado com sucesso.",
        });
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
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