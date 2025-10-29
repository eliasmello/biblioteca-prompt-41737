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
  roles: string[];
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
    selectedRoles: [] as string[]
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        selectedRoles: user.roles
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
    
    if (formData.selectedRoles.length === 0) {
      toast.error("Por favor, selecione pelo menos uma role.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: formData.name.trim() })
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      
      // Insert new roles (cast to proper type)
      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(
          formData.selectedRoles.map(role => ({
            user_id: user.id,
            role: role as 'user' | 'admin' | 'master'
          }))
        );

      if (rolesError) throw rolesError;
      
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
            <Label htmlFor="edit-role">Função Principal</Label>
            <Select 
              value={formData.selectedRoles[0] || 'user'} 
              onValueChange={(value: string) => setFormData({ ...formData, selectedRoles: [value] })}
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
            <p className="text-sm text-muted-foreground mt-1">
              A role do usuário determina suas permissões no sistema
            </p>
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