-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'agent', 'admin')),
  area text check (area in ('rem', 'ing', 'sis', 'ctrl')),
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  area text not null check (area in ('rem', 'ing', 'sis', 'ctrl')),
  description text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Requests table
create table public.requests (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  type text not null default 'question' check (type in ('question', 'request', 'incident')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  user_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_internal boolean not null default false,
  created_at timestamptz default now()
);

-- Status history
create table public.status_history (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  old_status text,
  new_status text,
  created_at timestamptz default now()
);

-- View for requests with details
create or replace view public.requests_with_details as
select
  r.*,
  p.full_name as user_full_name,
  p.email as user_email,
  c.name as category_name,
  c.area
from public.requests r
left join public.profiles p on r.user_id = p.id
left join public.categories c on r.category_id = c.id;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger requests_updated_at before update on public.requests
  for each row execute procedure public.update_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.requests enable row level security;
alter table public.comments enable row level security;
alter table public.status_history enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Service role full access profiles" on public.profiles using (true) with check (true);

-- Categories: anyone authenticated can read
create policy "Authenticated read categories" on public.categories for select using (auth.role() = 'authenticated');

-- Requests policies
create policy "Users see own requests" on public.requests for select using (auth.uid() = user_id);
create policy "Authenticated insert requests" on public.requests for insert with check (auth.uid() = user_id);

-- Comments policies
create policy "Users read comments on own requests" on public.comments for select
  using (exists (select 1 from public.requests where id = request_id and user_id = auth.uid()));

-- Default categories
insert into public.categories (name, area) values
  ('Liquidaciones de sueldo', 'rem'),
  ('Bonos y beneficios', 'rem'),
  ('Descuentos', 'rem'),
  ('Finiquitos', 'rem'),
  ('Carga de documentos', 'ing'),
  ('Actualización de datos', 'ing'),
  ('Validación de antecedentes', 'ing'),
  ('Consultas de estado', 'ing'),
  ('Errores del sistema', 'sis'),
  ('Accesos y permisos', 'sis'),
  ('Reportes', 'sis'),
  ('Integraciones', 'sis'),
  ('Seguimiento de solicitudes', 'ctrl'),
  ('Auditoría', 'ctrl'),
  ('Indicadores', 'ctrl'),
  ('Reclamos', 'ctrl');
