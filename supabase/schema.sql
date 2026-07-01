-- =============================================
-- PLATAFORMA DE SOLICITUDES Y PREGUNTAS
-- Schema para Supabase (PostgreSQL)
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📋',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.categories (name, description, color, icon) VALUES
  ('IT / Tecnología', 'Problemas con equipos, software, accesos', '#3b82f6', '💻'),
  ('Recursos Humanos', 'Vacaciones, nómina, beneficios', '#10b981', '👥'),
  ('Administración', 'Facturas, proveedores, compras', '#f59e0b', '📊'),
  ('Instalaciones', 'Mantenimiento, limpieza, espacios', '#ef4444', '🏢'),
  ('General', 'Consultas generales', '#6366f1', '❓');

-- REQUESTS
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'request' CHECK (type IN ('request', 'question', 'complaint', 'suggestion')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STATUS HISTORY
CREATE TABLE public.status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_requests BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_comments BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_history (request_id, changed_by, old_status, new_status)
    VALUES (NEW.id, COALESCE(NEW.assigned_to, NEW.user_id), OLD.status, NEW.status);
    INSERT INTO public.notifications (user_id, request_id, type, title, message)
    VALUES (NEW.user_id, NEW.id, 'status_change', 'Estado actualizado',
      'Tu solicitud cambió de "' || OLD.status || '" a "' || NEW.status || '"');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_request_status_change
  AFTER UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_status_change();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver todos los perfiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Actualizar propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Ver categorías" ON public.categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin gestiona categorías" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Ver solicitudes propias o si es admin/agent" ON public.requests FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent')));
CREATE POLICY "Crear solicitudes" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Actualizar solicitudes" ON public.requests FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent')));

CREATE POLICY "Ver comentarios" ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND (
    r.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent'))
  )) AND (is_internal = FALSE OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent'))));
CREATE POLICY "Crear comentarios" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ver notificaciones propias" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Actualizar notificaciones propias" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Ver historial" ON public.status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND (
    r.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent')))));

-- INDEXES
CREATE INDEX idx_requests_user_id ON public.requests(user_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_category_id ON public.requests(category_id);
CREATE INDEX idx_comments_request_id ON public.comments(request_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, is_read);

-- VIEW
CREATE VIEW public.requests_with_details AS
SELECT r.*, p.full_name as user_name, p.email as user_email, p.department,
  a.full_name as assigned_name, c.name as category_name, c.color as category_color, c.icon as category_icon,
  (SELECT COUNT(*) FROM public.comments WHERE request_id = r.id AND is_internal = FALSE) as comment_count
FROM public.requests r
LEFT JOIN public.profiles p ON p.id = r.user_id
LEFT JOIN public.profiles a ON a.id = r.assigned_to
LEFT JOIN public.categories c ON c.id = r.category_id;
