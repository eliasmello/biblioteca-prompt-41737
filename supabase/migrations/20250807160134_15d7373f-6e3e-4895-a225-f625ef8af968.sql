-- Tabela de perfis de usuários (complementa auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('master', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Tabela de prompts
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  subcategory VARCHAR(255),
  content TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  style_tags TEXT[] DEFAULT '{}',
  subject_tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para prompts
CREATE POLICY "Users can view all prompts" 
ON public.prompts 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create their own prompts" 
ON public.prompts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own prompts" 
ON public.prompts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can delete their own prompts" 
ON public.prompts 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Índices para performance
CREATE INDEX idx_prompts_title ON prompts USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_prompts_content ON prompts USING gin(to_tsvector('portuguese', content));
CREATE INDEX idx_prompts_tags ON prompts USING gin(tags);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_created_by ON prompts(created_by);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();