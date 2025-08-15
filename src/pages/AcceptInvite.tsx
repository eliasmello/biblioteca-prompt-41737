import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Eye, EyeOff } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  useSEO({
    title: "Aceitar Convite",
    description: "Complete seu cadastro e defina sua senha para acessar a plataforma."
  });

  useEffect(() => {
    console.log('AcceptInvite: Token from URL:', token);
    
    if (!token) {
      console.error('AcceptInvite: No token found in URL');
      toast.error("Token de convite inválido");
      navigate('/auth');
      return;
    }
    
    // Validar convite diretamente sem logout desnecessário
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      console.log('AcceptInvite: Validating token:', token);
      
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      console.log('AcceptInvite: Query result:', { data, error });

      if (error) {
        console.error('AcceptInvite: Database error:', error);
        toast.error("Erro ao verificar convite");
        navigate('/auth');
        return;
      }

      if (!data) {
        console.log('AcceptInvite: No valid invitation found');
        toast.error("Convite inválido ou expirado");
        navigate('/auth');
        return;
      }

      console.log('AcceptInvite: Valid invitation found:', data);
      setInvitation(data);
    } catch (error) {
      console.error('AcceptInvite: Validation error:', error);
      toast.error("Erro ao validar convite");
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      // Create user account
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            name: invitation.name,
            role: invitation.role
          }
        }
      });

      if (signUpError) throw signUpError;

      // Update invitation as used
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      if (updateError) throw updateError;

      // Update user profile with role
      if (userData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: invitation.role })
          .eq('id', userData.user.id);

        if (profileError) throw profileError;
      }

      toast.success("Conta criada com sucesso! Você pode fazer login agora.");
      navigate('/auth');
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </AuthLayout>
    );
  }

  if (!invitation) {
    return (
      <AuthLayout>
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Convite inválido ou expirado</p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Bem-vindo, {invitation.name}!</CardTitle>
          <CardDescription>
            Complete seu cadastro definindo uma senha para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Digite sua senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                placeholder="Confirme sua senha"
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Função:</strong> {invitation.role === 'user' ? 'Usuário Padrão' : invitation.role === 'admin' ? 'Admin' : 'Master'}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}