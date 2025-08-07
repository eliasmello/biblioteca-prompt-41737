import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  role: 'master' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth event:', event, 'Session:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Set loading false immediately, fetch profile in background
          setLoading(false);
          
          // Fetch profile in background without blocking UI
          fetchProfile(session.user.id).then(profileData => {
            if (mounted) {
              setProfile(profileData as Profile);
            }
          }).catch(error => {
            console.error('Error fetching profile:', error);
          });
        } else {
          setProfile(null);
          setLoading(false);
        }

        // No login toasts - they cause repetitive notifications
      }
    );

    // Check for existing session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Set loading false immediately
          setLoading(false);
          
          // Fetch profile in background
          fetchProfile(session.user.id).then(profileData => {
            if (mounted) {
              setProfile(profileData as Profile);
            }
          }).catch(error => {
            console.error('Error fetching profile on mount:', error);
          });
        } else {
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        if (mounted) setLoading(false);
      }
    };

    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Cadastro realizado!",
          description: "Por favor, verifique seu e-mail e clique no link de confirmação enviado para validar sua conta.",
        });
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('Email not confirmed')) {
          errorMessage = "Por favor, verifique seu e-mail e clique no link de confirmação antes de fazer login.";
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = "E-mail ou senha incorretos.";
        }
        
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive"
        });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      toast({
        title: "Logout realizado",
        description: "Até logo!"
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};