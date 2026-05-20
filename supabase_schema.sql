-- ══════════════════════════════════════════════════════════════
-- COBRAYA — Schema completo
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- ── Extensiones ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Perfiles (uno por usuario auth) ───────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company     text not null default '',
  whatsapp    text not null default '',
  signature   text not null default '',
  plan        text not null default 'free',
  created_at  timestamptz default now()
);

-- ── Config del agente (uno por perfil) ────────────────────────
create table agent_config (
  id                      uuid primary key default uuid_generate_v4(),
  profile_id              uuid not null references profiles(id) on delete cascade,
  enabled                 boolean default true,
  tone                    text default 'profesional',
  first_reminder_days     int  default 3,
  follow_up_days          int  default 5,
  max_follow_ups          int  default 3,
  offer_payment_plan      boolean default true,
  payment_plan_installments int default 3,
  escalate_after_days     int  default 15,
  channel_whatsapp        boolean default true,
  channel_email           boolean default false,
  working_hours_from      text default '09:00',
  working_hours_to        text default '18:00',
  created_at              timestamptz default now(),
  unique(profile_id)
);

-- ── Clientes ───────────────────────────────────────────────────
create table clients (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  rut         text not null,
  phone       text not null default '',
  email       text not null default '',
  created_at  timestamptz default now()
);

-- ── Facturas ───────────────────────────────────────────────────
create type invoice_status as enum (
  'pending', 'reminded', 'ai_negotiating', 'overdue', 'paid'
);

create type invoice_channel as enum ('whatsapp', 'email');

create table invoices (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  cfe_id      text not null,
  amount      numeric(12,2) not null,
  issued      date not null,
  due         date not null,
  status      invoice_status not null default 'pending',
  channel     invoice_channel,
  ai_note     text,
  created_at  timestamptz default now()
);

-- ── Conversaciones de WhatsApp ─────────────────────────────────
create table conversations (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  invoice_id  uuid references invoices(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── Mensajes ───────────────────────────────────────────────────
create type message_from as enum ('agent', 'client');
create type message_status as enum ('sent', 'delivered', 'read');

create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  from_role       message_from not null,
  body            text not null,
  status          message_status default 'sent',
  sent_at         timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — cada usuario solo ve sus datos
-- ══════════════════════════════════════════════════════════════

alter table profiles      enable row level security;
alter table agent_config  enable row level security;
alter table clients       enable row level security;
alter table invoices      enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;

-- profiles
create policy "own profile" on profiles
  for all using (auth.uid() = id);

-- agent_config
create policy "own agent_config" on agent_config
  for all using (profile_id = auth.uid());

-- clients
create policy "own clients" on clients
  for all using (profile_id = auth.uid());

-- invoices
create policy "own invoices" on invoices
  for all using (profile_id = auth.uid());

-- conversations
create policy "own conversations" on conversations
  for all using (profile_id = auth.uid());

-- messages (vía conversation)
create policy "own messages" on messages
  for all using (
    conversation_id in (
      select id from conversations where profile_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════
-- Trigger: crea profile + agent_config al registrarse
-- ══════════════════════════════════════════════════════════════

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, company, whatsapp, signature)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    coalesce(new.raw_user_meta_data->>'company', '')
  );

  insert into agent_config (profile_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- Vista: KPIs por usuario (para el dashboard)
-- ══════════════════════════════════════════════════════════════

create or replace view invoice_kpis as
select
  profile_id,
  sum(case when status = 'paid'   and date_trunc('month', created_at) = date_trunc('month', now()) then amount else 0 end) as cobrado_mes,
  sum(case when status in ('pending','reminded','ai_negotiating') then amount else 0 end) as pendiente,
  sum(case when status = 'overdue' then amount else 0 end) as vencido,
  round(
    avg(case when status = 'paid' then (created_at::date - issued) end)
  ) as dso
from invoices
group by profile_id;
