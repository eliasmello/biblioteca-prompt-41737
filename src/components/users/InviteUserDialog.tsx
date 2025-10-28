import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InviteUserDialogProps {
  onInviteCreated: () => void;
}

export default function InviteUserDialog({ onInviteCreated }: InviteUserDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin' | 'master'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if invitation already exists
      const { data: existingInvite, error: checkError } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar convite existente:', checkError);
        throw checkError;
      }

      if (existingInvite) {
        toast.error("Já existe um convite pendente para este email.");
        return;
      }

      // Check if user already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao verificar usuário existente:', profileError);
        throw profileError;
      }

      // Create invitation record
      const invitationToken = crypto.randomUUID();
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .insert([{
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          role: formData.role,
          token: invitationToken,
          created_by: user?.id
        }])
        .select()
        .single();

      if (inviteError) {
        console.error('Erro ao criar convite:', inviteError);
        throw inviteError;
      }
      
      toast.success("Convite criado com sucesso! O link pode ser copiado na aba de Convites Pendentes.");
      setOpen(false);
      setFormData({ name: '', email: '', role: 'user' });
      onInviteCreated();
      
    } catch (error: any) {
      console.error('Erro completo ao criar convite:', error);
      toast.error(`Erro ao criar convite: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            Envie um convite por email para que o usuário crie sua conta na plataforma.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Usuário</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Digite o nome completo"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Digite o email do usuário"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="role">Função</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: 'user' | 'admin' | 'master') => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário Padrão</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Um convite será criado para o usuário. Você poderá copiar o link de convite na aba "Convites Pendentes" para compartilhar manualmente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Convite'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}