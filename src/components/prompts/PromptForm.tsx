import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Prompt } from '@/types/prompt';

const promptSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  description: z.string().optional(),
  number: z.number().optional()
});

type PromptFormData = z.infer<typeof promptSchema>;

interface PromptFormProps {
  prompt?: Prompt;
  onSubmit: (data: PromptFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function PromptForm({ prompt, onSubmit, onCancel, isSubmitting }: PromptFormProps) {
  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: prompt?.title || '',
      category: prompt?.category || '',
      subcategory: prompt?.subcategory || '',
      content: prompt?.content || '',
      description: prompt?.description || '',
      number: prompt?.number || undefined
    }
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {prompt ? 'Editar Prompt' : 'Novo Prompt'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Diorama / Nature Scene"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número (opcional)</Label>
              <Input
                id="number"
                type="number"
                placeholder="Ex: 6"
                {...form.register('number', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Ex: Diorama"
                {...form.register('category')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria</Label>
              <Input
                id="subcategory"
                placeholder="Ex: Nature Scene"
                {...form.register('subcategory')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Breve descrição do prompt"
              {...form.register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo do Prompt</Label>
            <Textarea
              id="content"
              placeholder="Cole aqui o conteúdo completo do prompt..."
              rows={10}
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-destructive">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="gradient">
              {isSubmitting ? 'Salvando...' : (prompt ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}