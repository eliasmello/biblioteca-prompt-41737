import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { usePrompts } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Tag,
  ArrowLeft,
  Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryStats {
  name: string;
  count: number;
  subcategories: { name: string; count: number }[];
}

export default function Categories() {
  const navigate = useNavigate();
  const { prompts, updatePrompt } = usePrompts();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Calculate category statistics
  useEffect(() => {
    const categoryMap = new Map<string, CategoryStats>();
    
    prompts.forEach(prompt => {
      const categoryName = prompt.category || 'Sem Categoria';
      const subcategoryName = prompt.subcategory || '';
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          count: 0,
          subcategories: []
        });
      }
      
      const category = categoryMap.get(categoryName)!;
      category.count++;
      
      if (subcategoryName) {
        const existingSubcat = category.subcategories.find(s => s.name === subcategoryName);
        if (existingSubcat) {
          existingSubcat.count++;
        } else {
          category.subcategories.push({ name: subcategoryName, count: 1 });
        }
      }
    });
    
    setCategories(Array.from(categoryMap.values()));
  }, [prompts]);

  const handleRenameCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    try {
      // Update all prompts with the old category name
      const promptsToUpdate = prompts.filter(p => p.category === editingCategory);
      
      for (const prompt of promptsToUpdate) {
        await updatePrompt(prompt.id, { category: newCategoryName.trim() });
      }

      toast({
        title: "Sucesso!",
        description: `Categoria "${editingCategory}" renomeada para "${newCategoryName}".`,
      });

      setIsEditModalOpen(false);
      setEditingCategory('');
      setNewCategoryName('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao renomear categoria.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Os prompts ficarão sem categoria.`)) {
      return;
    }

    try {
      // Update all prompts to remove the category
      const promptsToUpdate = prompts.filter(p => p.category === categoryName);
      
      for (const prompt of promptsToUpdate) {
        await updatePrompt(prompt.id, { category: '' });
      }

      toast({
        title: "Sucesso!",
        description: `Categoria "${categoryName}" excluída.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (categoryName: string) => {
    setEditingCategory(categoryName);
    setNewCategoryName(categoryName);
    setIsEditModalOpen(true);
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500'
  ];

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
          Voltar para Prompts
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Categorias</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as categorias dos seus prompts
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Palette className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Subcategorias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Plus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{prompts.length}</p>
                <p className="text-sm text-muted-foreground">Total de Prompts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <Card key={category.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}
                  />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <Badge variant="secondary">{category.count}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subcategories */}
              {category.subcategories.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Subcategorias:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {category.subcategories.map((subcat) => (
                      <Badge key={subcat.name} variant="outline" className="text-xs">
                        {subcat.name} ({subcat.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(category.name)}
                  className="flex-1 gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Renomear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.name)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {categories.length === 0 && (
          <Card className="col-span-full text-center py-12">
            <CardContent>
              <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground">
                As categorias serão criadas automaticamente quando você adicionar prompts.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Categoria</DialogTitle>
            <DialogDescription>
              Digite o novo nome para a categoria "{editingCategory}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome da Categoria</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da categoria"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRenameCategory}>
                Renomear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}