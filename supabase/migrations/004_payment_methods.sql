-- ══════════════════════════════════════════════════════════════
-- Migración 004: métodos de pago por negocio
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

alter table profiles
  -- Transferencia bancaria
  add column if not exists bank_name    text default '',
  add column if not exists bank_account text default '',
  add column if not exists bank_alias   text default '',
  -- Stripe (Apple Pay / Google Pay / tarjeta)
  add column if not exists stripe_pk    text default '',
  add column if not exists stripe_sk    text default '';
