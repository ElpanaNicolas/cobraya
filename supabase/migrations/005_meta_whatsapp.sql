-- ══════════════════════════════════════════════════════════════
-- Migración 005: WhatsApp Cloud API (Meta) por perfil
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

alter table profiles
  -- Proveedor activo de WhatsApp: 'twilio' o 'meta'
  add column if not exists wa_provider           text default 'twilio',
  -- Credenciales Meta WhatsApp Cloud API
  add column if not exists meta_phone_number_id  text default '',
  add column if not exists meta_access_token     text default '',
  add column if not exists meta_waba_id          text default '',
  -- Token de verificación del webhook (elegido por el negocio)
  add column if not exists meta_verify_token     text default '';
