-- ══════════════════════════════════════════════════════════════
-- Migración 003: campos para página de pago pública
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Instrucciones de transferencia bancaria (texto libre)
alter table profiles
  add column if not exists payment_instructions text default '';

-- Access Token de MercadoPago del negocio
alter table profiles
  add column if not exists mp_access_token text default '';

-- Bucket de Supabase Storage para comprobantes subidos desde la web
-- (ejecutar por separado si el bucket no existe)
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
-- on conflict do nothing;
