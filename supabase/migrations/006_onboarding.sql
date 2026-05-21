-- ══════════════════════════════════════════════════════════════
-- Migración 006: flag de onboarding por perfil
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

alter table profiles
  add column if not exists onboarding_completed boolean default false;
