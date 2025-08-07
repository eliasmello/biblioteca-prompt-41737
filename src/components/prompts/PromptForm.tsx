import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Upload, X } from 'lucide-react';
import { Prompt } from '@/types/prompt';

const promptSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  description: z.string().optional(),
  number: z.number().optional(),
  previewImage: z.string().optional()
});

type PromptFormData = z.infer<typeof promptSchema>;

interface PromptFormProps {
  prompt?: Prompt;
  onSubmit: (data: PromptFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function PromptForm({ prompt, onSubmit, onCancel, isSubmitting }: PromptFormProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(prompt?.previewImage || null);

  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: prompt?.title || '',
      category: prompt?.category || '',
      subcategory: prompt?.subcategory || '',
      content: prompt?.content || '',
      description: prompt?.description || '',
      number: prompt?.number || undefined,
      previewImage: prompt?.previewImage || ''
    }
  });

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      form.reset({
        title: prompt.title || '',
        category: prompt.category || '',
        subcategory: prompt.subcategory || '',
        content: prompt.content || '',
        description: prompt.description || '',
        number: prompt.number || undefined,
        previewImage: prompt.previewImage || ''
      });
      setPreviewImage(prompt.previewImage || null);
    }
  }, [prompt, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        form.setValue('previewImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    form.setValue('previewImage', '');
  };

  const handleFormSubmit = (data: PromptFormData) => {
    onSubmit({
      ...data,
      previewImage: previewImage || undefined
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {prompt ? 'Editar Prompt' : 'Novo Prompt'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Imagem de Preview</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {previewImage ? (
                <div className="relative">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Adicionar imagem de preview
                  </p>
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Escolher arquivo
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}
            </div>
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