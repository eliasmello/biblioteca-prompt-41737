
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Upload, X, Download, Globe, Lock, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Prompt } from '@/types/prompt';
import CategorySelect from '@/components/prompts/CategorySelect';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { validatePromptNumber } from '@/services/promptService';

const promptSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  description: z.string().optional(),
  number: z.number().optional(),
  previewImage: z.string().optional(),
  isPublic: z.boolean().optional(),
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
  const [numberError, setNumberError] = useState<string | null>(null);
  const { generateImage, editImage, isLoading: isGeneratingImage } = useImageGeneration();
  const { toast } = useToast();

  const { hasRole } = useAuth();
  
  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: prompt?.title || '',
      category: prompt?.category || '',
      subcategory: prompt?.subcategory || '',
      content: prompt?.content || '',
      description: prompt?.description || '',
      number: prompt?.number || undefined,
      previewImage: prompt?.previewImage || '',
      isPublic: prompt?.isPublic ?? (hasRole('master') ? true : false),
    }
  });

  // Reset form apenas quando o ID do prompt mudar (evita reset enquanto o usuário digita)
  useEffect(() => {
    if (!prompt?.id) return;
    form.reset({
      title: prompt.title || '',
      category: prompt.category || '',
      subcategory: prompt.subcategory || '',
      content: prompt.content || '',
      description: prompt.description || '',
      number: prompt.number || undefined,
      previewImage: prompt.previewImage || '',
      isPublic: prompt.isPublic || false,
    });
    setPreviewImage(prompt.previewImage || null);
  }, [prompt?.id, form]);

  // Quando apenas a imagem do prompt mudar (ex.: carregada tardiamente),
  // atualizamos a pré-visualização sem resetar os demais campos do formulário
  useEffect(() => {
    if (!prompt) return;
    setPreviewImage(prompt.previewImage || null);
    form.setValue('previewImage', prompt.previewImage || '', { shouldDirty: false });
  }, [prompt?.previewImage, form]);

  // Sincronização inteligente: título ↔ número
  const syncTitleWithNumber = useCallback((title: string) => {
    const match = title.match(/^Prompt #(\d+)$/i);
    if (match) {
      const extractedNumber = parseInt(match[1]);
      const currentNumber = form.watch('number');
      if (currentNumber !== extractedNumber) {
        form.setValue('number', extractedNumber, { shouldDirty: true });
      }
    }
  }, [form]);

  const syncNumberWithTitle = useCallback(async (number: number | undefined) => {
    if (!number) {
      setNumberError(null);
      return;
    }

    const currentTitle = form.watch('title');
    const isPromptFormat = /^Prompt #\d+$/i.test(currentTitle);
    
    // Validar unicidade do número
    const { data } = await supabase.from('profiles').select('id').single();
    const userId = data?.id;
    
    if (userId) {
      const isValid = await validatePromptNumber(number, userId, prompt?.id);
      if (!isValid) {
        setNumberError('Este número já está em uso');
      } else {
        setNumberError(null);
        
        // Se título segue padrão "Prompt #X", atualizar automaticamente
        if (isPromptFormat) {
          form.setValue('title', `Prompt #${number}`, { shouldDirty: true });
        }
      }
    }
  }, [form, prompt?.id]);

  // Watch para mudanças no título
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && value.title) {
        syncTitleWithNumber(value.title);
      }
      if (name === 'number') {
        syncNumberWithTitle(value.number);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, syncTitleWithNumber, syncNumberWithTitle]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione apenas arquivos de imagem.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande. Máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload para Storage
      const timestamp = Date.now();
      const randomId = crypto.randomUUID().split('-')[0];
      const filename = `manual-upload-${randomId}-${timestamp}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(filename, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(uploadData.path);

      // Atualizar preview local
      setPreviewImage(publicUrl);
      form.setValue('previewImage', publicUrl, { shouldDirty: true });
      
      toast({
        title: 'Upload concluído!',
        description: 'Imagem enviada com sucesso.',
      });
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem. Tente novamente.',
        variant: 'destructive',
      });
    }
    
    // Reset input value to allow same file selection
    event.target.value = '';
  };

  const removeImage = () => {
    setPreviewImage(null);
    form.setValue('previewImage', '', { shouldDirty: true });
  };

  const handleDownloadImage = async () => {
    try {
      const src = previewImage || form.getValues('previewImage');
      if (!src) return;

      const slugify = (s: string) =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const baseName = slugify(prompt?.title || 'prompt-preview') || 'prompt-preview';

      const toBlobAndDownload = async (href: string) => {
        const res = await fetch(href);
        const blob = await res.blob();
        const ext = (blob.type.split('/')[1] || 'png').split(';')[0];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };

      await toBlobAndDownload(src);
    } catch (err) {
      console.error('Erro ao baixar imagem de preview', err);
    }
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
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                type="number"
                min="1"
                placeholder="Ex: 6"
                {...form.register('number', { valueAsNumber: true })}
              />
              {numberError && (
                <p className="text-sm text-destructive">{numberError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Se o título for "Prompt #X", o número será sincronizado automaticamente
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <CategorySelect
                value={form.watch('category') || ''}
                onChange={(v) => form.setValue('category', v, { shouldDirty: true })}
                placeholder="Ex: Diorama"
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
                    alt="Preview do prompt"
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    width={800}
                    height={192}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        const content = form.watch('content');
                        if (!content) {
                          toast({
                            title: 'Conteúdo necessário',
                            description: 'Adicione o conteúdo do prompt para editar a imagem.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        const result = await editImage(content, previewImage, prompt?.id);
                        if (result) {
                          setPreviewImage(result.imageUrl);
                          form.setValue('previewImage', result.imageUrl);
                          toast({
                            title: 'Imagem editada!',
                            description: 'A imagem foi editada com sucesso.',
                          });
                        }
                      }}
                      disabled={isGeneratingImage}
                      aria-label="Editar imagem com IA"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadImage}
                      aria-label="Baixar imagem de preview"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      aria-label="Remover imagem de preview"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicionar imagem de preview
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={async () => {
                        const content = form.watch('content');
                        if (!content) {
                          toast({
                            title: 'Conteúdo necessário',
                            description: 'Adicione o conteúdo do prompt antes de gerar a imagem.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        const result = await generateImage(content, prompt?.id);
                        if (result) {
                          setPreviewImage(result.imageUrl);
                          form.setValue('previewImage', result.imageUrl);
                          toast({
                            title: 'Imagem gerada!',
                            description: 'A imagem foi gerada com sucesso pela IA.',
                          });
                        }
                      }}
                      disabled={isGeneratingImage}
                      className="gap-2"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar com IA
                        </>
                      )}
                    </Button>
                    
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Fazer upload
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

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="is-public" className="font-semibold cursor-pointer">
                    {form.watch('isPublic') ? (
                      <><Globe className="w-4 h-4 inline mr-1" />Prompt Público</>
                    ) : (
                      <><Lock className="w-4 h-4 inline mr-1" />Prompt Privado</>
                    )}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.watch('isPublic') 
                    ? 'Este prompt será visível na galeria pública e poderá ser compartilhado.'
                    : 'Este prompt será visível apenas para você.'
                  }
                </p>
              </div>
              <Switch
                id="is-public"
                checked={form.watch('isPublic')}
                onCheckedChange={(checked) => form.setValue('isPublic', checked, { shouldDirty: true })}
              />
            </div>
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
