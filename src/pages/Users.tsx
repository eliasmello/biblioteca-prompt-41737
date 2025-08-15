import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Users as UsersIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InviteUserDialog from "@/components/users/InviteUserDialog";
import UsersTable from "@/components/users/UsersTable";
import InvitationsTable from "@/components/users/InvitationsTable";
import { RegistrationsTable } from "@/components/users/RegistrationsTable";

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

interface Registration {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

export default function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Gerenciar Usuários",
    description: "Gerencie usuários do sistema, permissões e acessos."
  });

  useEffect(() => {
    if (profile?.role !== 'master') {
      toast.error("Acesso negado. Apenas o Master User pode gerenciar usuários.");
      return;
    }
    fetchUsersInvitationsAndRegistrations();
    
    // Auto-refresh a cada 30 segundos para manter dados atualizados
    const interval = setInterval(() => {
      console.log('DEBUG: Auto-refresh dos convites, usuários e solicitações');
      fetchUsersInvitationsAndRegistrations();
    }, 30000);

    return () => clearInterval(interval);
  }, [profile]);

  const fetchUsersInvitationsAndRegistrations = async () => {
    await Promise.all([fetchUsers(), fetchInvitations(), fetchRegistrations()]);
  };

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

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
      
      // Map profiles without trying to get email from auth.admin (requires service role)
      const users = (data || []).map((profile) => ({
        ...profile,
        email: undefined, // Email não disponível sem service role
        role: profile.role as 'user' | 'admin' | 'master'
      }));

      setUsers(users);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      toast.error(`Erro ao carregar usuários: ${error.message || 'Erro desconhecido'}`);
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

      if (error) {
        console.error('Erro ao buscar convites:', error);
        throw error;
      }
      
      const typedInvitations = (data || []).map(invitation => ({
        ...invitation,
        role: invitation.role as 'user' | 'admin' | 'master'
      }));
      
      console.log('DEBUG: Convites carregados do banco:', typedInvitations.map(inv => ({ 
        email: inv.email, 
        token: inv.token, 
        id: inv.id 
      })));
      
      setInvitations(typedInvitations);
    } catch (error: any) {
      console.error('Erro ao buscar convites:', error);
      toast.error(`Erro ao carregar convites: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar solicitações:', error);
        throw error;
      }
      
      const typedRegistrations = (data || []).map(reg => ({
        ...reg,
        status: reg.status as 'pending' | 'approved' | 'rejected'
      }));
      
      setRegistrations(typedRegistrations);
    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', error);
      toast.error(`Erro ao carregar solicitações: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Access control
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

  // Loading state
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
        
        <InviteUserDialog onInviteCreated={fetchUsersInvitationsAndRegistrations} />
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Usuários Ativos
            {users.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {users.length}
              </Badge>
            )}
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
          <TabsTrigger value="registrations" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Solicitações
            {registrations.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {registrations.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTable users={users} onUserUpdated={fetchUsers} />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsTable invitations={invitations} onInvitationDeleted={fetchInvitations} />
        </TabsContent>

        <TabsContent value="registrations">
          <RegistrationsTable registrations={registrations} onRegistrationUpdate={fetchUsersInvitationsAndRegistrations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}