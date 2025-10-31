-- Add input validation to validate_invitation_token function
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token text)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  role text,
  expires_at timestamp with time zone,
  is_valid boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input token
  IF _token IS NULL THEN
    RAISE EXCEPTION 'Token cannot be NULL';
  END IF;
  
  IF length(_token) < 32 OR length(_token) > 50 THEN
    RAISE EXCEPTION 'Invalid token length';
  END IF;
  
  -- Validate UUID format (standard UUID v4 format)
  IF _token !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN
    RAISE EXCEPTION 'Invalid token format';
  END IF;
  
  -- Return validated data
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    ui.name,
    ui.role,
    ui.expires_at,
    (ui.used_at IS NULL AND ui.expires_at > NOW()) as is_valid
  FROM user_invitations ui
  WHERE ui.token = _token
  LIMIT 1;
END;
$$;

-- Add input validation to has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF _user_id IS NULL OR _role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Execute role check
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Add input validation to get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return user's highest priority role
  RETURN (
    SELECT role
    FROM user_roles
    WHERE user_id = _user_id
    ORDER BY 
      CASE role
        WHEN 'master' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'user' THEN 3
      END
    LIMIT 1
  );
END;
$$;

-- Add validation to handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name text;
  user_role app_role;
BEGIN
  -- Validate and sanitize metadata (limit to 100 chars)
  user_name := COALESCE(
    substring(NEW.raw_user_meta_data->>'name', 1, 100),
    substring(NEW.email, 1, 100)
  );
  
  -- Validate role from metadata with error handling
  BEGIN
    user_role := (NEW.raw_user_meta_data->>'role')::app_role;
  EXCEPTION WHEN OTHERS THEN
    user_role := 'user'::app_role; -- Default to 'user' on invalid role
  END;
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (id, name, display_name, email, is_active)
  VALUES (NEW.id, user_name, user_name, NEW.email, true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert role with validation
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add database constraints for input validation (PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE constraints)
DO $$ 
BEGIN
  -- Add constraint for prompts title length
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_title_length') THEN
    ALTER TABLE prompts ADD CONSTRAINT check_title_length CHECK (length(title) <= 200);
  END IF;
  
  -- Add constraint for prompts content length
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_content_length') THEN
    ALTER TABLE prompts ADD CONSTRAINT check_content_length CHECK (length(content) <= 50000);
  END IF;
  
  -- Add constraint for profiles name length
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_name_length') THEN
    ALTER TABLE profiles ADD CONSTRAINT check_name_length CHECK (length(display_name) <= 100);
  END IF;
  
  -- Add constraint for user_invitations email format
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
    ALTER TABLE user_invitations ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;