-- ══════════════════════════════════════════════════════════════
-- Migración 010: billing y planes
-- ══════════════════════════════════════════════════════════════

-- Aseguramos que exista la columna plan (puede ya existir en 'free')
alter table profiles
  add column if not exists plan text not null default 'free';

-- ID de suscripción de MercadoPago para este perfil (preapproval_id)
alter table profiles
  add column if not exists mp_preapproval_id text;

-- Fecha de inicio y fin del plan pago
alter table profiles
  add column if not exists plan_starts_at  timestamptz;
alter table profiles
  add column if not exists plan_expires_at timestamptz;
