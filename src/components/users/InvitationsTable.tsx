import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Clock, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

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

interface InvitationsTableProps {
  invitations: Invitation[];
  onInvitationDeleted: () => void;
}

export default function InvitationsTable({ invitations, onInvitationDeleted }: InvitationsTableProps) {
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  const [deletingInvite, setDeletingInvite] = useState<string | null>(null);

  const copyInviteLink = async (token: string) => {
    console.log('DEBUG: Token recebido na função copyInviteLink:', token);
    
    // Verificar se o token ainda existe no banco de dados
    try {
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .select('id, email, name, expires_at, used_at')
        .eq('token', token)
        .single();

      if (error || !invitation) {
        console.error('DEBUG: Token não encontrado no banco:', token, error);
        toast.error("Este convite não é mais válido. Atualize a página e tente novamente.");
        return;
      }

      if (invitation.used_at) {
        console.error('DEBUG: Token já foi usado:', token);
        toast.error("Este convite já foi utilizado.");
        return;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        console.error('DEBUG: Token expirado:', token, invitation.expires_at);
        toast.error("Este convite expirou.");
        return;
      }

      console.log('DEBUG: Token válido encontrado:', invitation);
    } catch (error) {
      console.error('DEBUG: Erro ao validar token:', error);
      toast.error("Erro ao validar convite. Tente novamente.");
      return;
    }

    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    console.log('DEBUG: Link gerado:', inviteUrl);
    
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

  const deleteInvitation = async (invitationId: string) => {
    setDeletingInvite(invitationId);
    
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success("Convite removido com sucesso!");
      onInvitationDeleted();
    } catch (error) {
      console.error('Erro ao remover convite:', error);
      toast.error("Erro ao remover convite");
    } finally {
      setDeletingInvite(null);
    }
  };

  return (
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
                <TableHead>Ações</TableHead>
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
                          <Check className="h-4 w-4 text-success" />
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
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingInvite === invitation.id}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingInvite === invitation.id ? "Removendo..." : "Remover"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover o convite para <strong>{invitation.name}</strong> ({invitation.email})?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteInvitation(invitation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover Convite
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}