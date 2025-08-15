import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Registration {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

interface RegistrationsTableProps {
  registrations: Registration[];
  onRegistrationUpdate: () => void;
}

export function RegistrationsTable({ registrations, onRegistrationUpdate }: RegistrationsTableProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (registration: Registration) => {
    setProcessing(registration.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('approve-registration', {
        body: { registrationId: registration.id }
      });

      if (error) throw error;

      toast.success(`Usuário ${registration.name} aprovado com sucesso!`);
      onRegistrationUpdate();
    } catch (error: any) {
      console.error('Erro ao aprovar solicitação:', error);
      toast.error(error.message || "Erro ao aprovar solicitação");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (registration: Registration) => {
    setProcessing(registration.id);
    
    try {
      const { error } = await supabase
        .from('user_registrations')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) throw error;

      toast.success(`Solicitação de ${registration.name} rejeitada.`);
      onRegistrationUpdate();
    } catch (error: any) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error(error.message || "Erro ao rejeitar solicitação");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Pendente';
    }
  };

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Nenhuma solicitação de registro encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((registration) => (
        <Card key={registration.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{registration.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{registration.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(registration.status)}>
                  {getStatusIcon(registration.status)}
                  <span className="ml-1">{getStatusText(registration.status)}</span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {registration.message && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm">{registration.message}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Solicitado em: {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                </p>
                
                {registration.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(registration)}
                      disabled={processing === registration.id}
                    >
                      {processing === registration.id ? "Processando..." : "Rejeitar"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(registration)}
                      disabled={processing === registration.id}
                    >
                      {processing === registration.id ? "Processando..." : "Aprovar"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}