import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users as UsersIcon, UserPlus, Edit2, Trash2, Copy, Check, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSEO } from "@/hooks/useSEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'user' | 'admin' | 'master';
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'master';
  token: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
}

export default function Users() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin' | 'master'
  });

  useSEO({
    title: "Gerenciar Usuários",
    description: "Gerencie usuários do sistema, permissões e acessos."
  });

  useEffect(() => {
    if (profile?.role !== 'master') {
      toast.error("Acesso negado. Apenas o Master User pode gerenciar usuários.");
      return;
    }
    fetchUsers();
    fetchInvitations();
  }, [profile]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          role,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get email from auth.users for each profile
      const usersWithEmails = await Promise.all(
        data.map(async (profile) => {
          const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: authData.user?.email,
            role: profile.role as 'user' | 'admin' | 'master'
          };
        })
      );

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedInvitations = (data || []).map(invitation => ({
        ...invitation,
        role: invitation.role as 'user' | 'admin' | 'master'
      }));
      
      setInvitations(typedInvitations);
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      toast.error("Erro ao carregar convites");
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingInvite) {
        toast.error("Já existe um convite pendente para este email.");
        return;
      }

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .insert([{
          email: formData.email,
          name: formData.name,
          role: formData.role,
          invited_by: user?.id
        }])
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: formData.email,
          name: formData.name,
          inviteToken: invitation.token
        }
      });

      if (emailError) throw emailError;
      
      toast.success("Convite criado com sucesso! O link pode ser copiado na aba de Convites Pendentes.");
      setShowAddDialog(false);
      setFormData({ name: '', email: '', role: 'user' });
      fetchUsers();
      fetchInvitations();
    } catch (error) {
      console.error('Erro ao criar convite:', error);
      toast.error("Erro ao criar convite");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        
        toast.success("Usuário atualizado com sucesso!");
        setEditingUser(null);
        setFormData({ name: '', email: '', role: 'user' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error("Erro ao salvar usuário");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      
      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error("Erro ao excluir usuário");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      role: user.role
    });
  };

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(token);
      toast.success("Link de convite copiado!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedInvite(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error("Erro ao copiar link");
    }
  };

  if (profile?.role !== 'master') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Acesso negado. Apenas o Master User pode acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Usuário</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Digite o nome completo"
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
                />
              </div>
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value: 'user' | 'admin' | 'master') => setFormData({ ...formData, role: value })}>
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
                <Button type="submit">Criar Convite</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Usuários Ativos
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Convites Pendentes
            {invitations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                Gerencie todos os usuários ativos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'master' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'}>
                          {user.role === 'master' ? 'Master' : user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            disabled={user.id === user?.id}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user.id)}
                            disabled={user.id === user?.id || user.role === 'master'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
              <CardDescription>
                Gerencie convites que ainda não foram utilizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum convite pendente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Link de Convite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.name}</TableCell>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge variant={invitation.role === 'master' ? 'default' : invitation.role === 'admin' ? 'secondary' : 'outline'}>
                            {invitation.role === 'master' ? 'Master' : invitation.role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInviteLink(invitation.token)}
                            className="flex items-center gap-2"
                          >
                            {copiedInvite === invitation.token ? (
                              <>
                                <Check className="h-4 w-4 text-green-600" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar Link
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
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
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Função</Label>
              <Select value={formData.role} onValueChange={(value: 'user' | 'admin' | 'master') => setFormData({ ...formData, role: value })}>
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
              <Button type="submit">Salvar</Button>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}