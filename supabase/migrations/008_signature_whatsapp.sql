-- ══════════════════════════════════════════════════════════════
-- Migración 008: columnas signature y whatsapp en profiles
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Firma de texto libre que el agente adjunta al final de cada mensaje.
-- Si está vacía, se usa el nombre de la empresa.
alter table profiles
  add column if not exists signature text default '';

-- Número de WhatsApp del negocio (espejo de twilio_wa_number).
-- Se sincroniza al guardar configuración.
alter table profiles
  add column if not exists whatsapp text default '';
