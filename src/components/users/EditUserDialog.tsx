import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'user' | 'admin' | 'master';
  is_active: boolean;
  created_at: string;
}

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export default function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'user' as 'user' | 'admin' | 'master'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!formData.name.trim()) {
      toast.error("Por favor, preencha o nome do usuário.");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          role: formData.role
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
      }
      
      toast.success("Usuário atualizado com sucesso!");
      onOpenChange(false);
      onUserUpdated();
      
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(`Erro ao atualizar usuário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
              placeholder="Digite o nome do usuário"
            />
          </div>
          <div>
            <Label htmlFor="edit-role">Função</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: 'user' | 'admin' | 'master') => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}