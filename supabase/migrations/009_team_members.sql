-- ══════════════════════════════════════════════════════════════
-- Migración 009: multi-usuario por empresa (team members)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Columna en profiles para miembros del equipo.
--    Si parent_profile_id IS NOT NULL → este usuario es miembro
--    del equipo del propietario con ese ID.
alter table profiles
  add column if not exists parent_profile_id uuid references profiles(id) on delete set null;

-- 2. Tabla de invitaciones pendientes
create table if not exists invitations (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles(id) on delete cascade not null,
  email        text not null,
  role         text not null default 'member',
  token        text unique not null default encode(gen_random_bytes(32), 'hex'),
  accepted_at  timestamptz,
  expires_at   timestamptz not null default now() + interval '7 days',
  created_at   timestamptz not null default now()
);

-- RLS invitations: solo el propietario gestiona sus invitaciones
alter table invitations enable row level security;

drop policy if exists "owner manages invitations" on invitations;
create policy "owner manages invitations" on invitations
  using  (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Permitir que el destinatario lea su propia invitación (para aceptarla)
drop policy if exists "invitee reads own" on invitations;
create policy "invitee reads own" on invitations
  for select using (email = (select email from auth.users where id = auth.uid()));

-- 3. Función auxiliar: retorna el profile_id efectivo para el usuario actual.
--    Si es miembro del equipo → devuelve el profile del propietario.
--    Si es propietario → devuelve su propio auth.uid().
create or replace function my_profile_id()
returns uuid language sql stable security definer as $$
  select coalesce(
    (select parent_profile_id from profiles where id = auth.uid() and parent_profile_id is not null),
    auth.uid()
  )
$$;

-- 4. Actualizar políticas RLS para usar my_profile_id()
--    (ajusta los nombres de policy según tu schema — estos son los genéricos)

-- clients
drop policy if exists "own profile" on clients;
create policy "own profile" on clients
  using  (profile_id = my_profile_id())
  with check (profile_id = my_profile_id());

-- invoices
drop policy if exists "own profile" on invoices;
create policy "own profile" on invoices
  using  (profile_id = my_profile_id())
  with check (profile_id = my_profile_id());

-- conversations
drop policy if exists "own profile" on conversations;
create policy "own profile" on conversations
  using  (profile_id = my_profile_id())
  with check (profile_id = my_profile_id());

-- agent_config
drop policy if exists "own profile" on agent_config;
create policy "own profile" on agent_config
  using  (profile_id = my_profile_id())
  with check (profile_id = my_profile_id());

-- 5. Vista del equipo del propietario (miembros aceptados)
create or replace view team_members_view as
  select
    p.id          as member_id,
    p.company     as member_company,
    u.email       as member_email,
    p.created_at  as joined_at,
    p.parent_profile_id as owner_id
  from profiles p
  join auth.users u on u.id = p.id
  where p.parent_profile_id is not null;

-- RLS no aplica a vistas: la usaremos solo via service_role en edge functions
-- Para acceso desde el cliente filtramos con .eq('owner_id', user.id)

-- Nota: si alguna policy "own profile" no existe (distinto nombre), creala
-- apuntando a my_profile_id() en lugar de auth.uid().
