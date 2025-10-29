import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EditUserDialog from "./EditUserDialog";

interface User {
  id: string;
  name: string;
  email?: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

interface UsersTableProps {
  users: User[];
  onUserUpdated: () => void;
}

export default function UsersTable({ users, onUserUpdated }: UsersTableProps) {
  const { user: currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingUserId(userId);

    try {
      // First, delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Erro ao excluir perfil:', profileError);
        throw profileError;
      }

      // Then try to delete from auth.users (this might fail if we don't have admin privileges)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError && authError.message !== 'User not allowed') {
          console.warn('Não foi possível excluir da auth:', authError);
        }
      } catch (authError) {
        console.warn('Erro ao excluir da auth (pode ser esperado):', authError);
      }
      
      toast.success("Usuário excluído com sucesso!");
      onUserUpdated();
      
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(`Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie todos os usuários ativos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
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
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map(role => (
                          <Badge 
                            key={role}
                            variant={role === 'master' ? 'default' : role === 'admin' ? 'secondary' : 'outline'}
                          >
                            {role === 'master' ? 'Master' : role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                        ))}
                      </div>
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
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? "Não é possível editar seu próprio usuário" : "Editar usuário"}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user.id)}
                          disabled={
                            user.id === currentUser?.id || 
                            user.roles.includes('master') || 
                            deletingUserId === user.id
                          }
                          title={
                            user.id === currentUser?.id 
                              ? "Não é possível excluir seu próprio usuário"
                              : user.roles.includes('master')
                              ? "Não é possível excluir usuário master"
                              : "Excluir usuário"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onUserUpdated={onUserUpdated}
      />
    </>
  );
}