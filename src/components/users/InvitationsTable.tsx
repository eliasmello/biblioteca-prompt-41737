import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
}

export default function InvitationsTable({ invitations }: InvitationsTableProps) {
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

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
  );
}