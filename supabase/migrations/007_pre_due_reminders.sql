-- ══════════════════════════════════════════════════════════════
-- Migración 007: recordatorio previo al vencimiento
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Días ANTES del vencimiento para enviar un aviso preventivo.
-- 0 = desactivado. 3 = avisa 3 días antes.
alter table agent_config
  add column if not exists pre_due_reminder_days int default 3;
