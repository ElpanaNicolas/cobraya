-- ══════════════════════════════════════════════════════════════
-- Migración 001: credenciales de Twilio por perfil
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Agregar columnas de Twilio al perfil del negocio
alter table profiles
  add column if not exists twilio_account_sid  text default '',
  add column if not exists twilio_auth_token   text default '',
  add column if not exists twilio_wa_number    text default '';

-- Nota: en producción las credenciales deberían estar cifradas.
-- Para el MVP las guardamos en texto plano con RLS activado
-- (solo el dueño del perfil puede leerlas).
-- La política "own profile" ya cubre esto.
