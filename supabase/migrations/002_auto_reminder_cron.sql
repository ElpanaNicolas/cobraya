-- ══════════════════════════════════════════════════════════════
-- Migración 002: cron diario de recordatorios automáticos
-- Requiere extensiones: pg_cron y pg_net (ya incluidas en Supabase)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Habilitar extensiones si no están activas
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Eliminar el cron si ya existe (para poder re-ejecutar la migración)
select cron.unschedule('auto-reminder-daily')
where exists (
  select 1 from cron.job where jobname = 'auto-reminder-daily'
);

-- Programar el cron: todos los días a las 12:00 UTC (= 09:00 Uruguay UTC-3)
-- La función auto-reminder verifica el horario laboral de cada negocio
select cron.schedule(
  'auto-reminder-daily',
  '0 12 * * *',
  $$
  select net.http_post(
    url     := 'https://rytsjzwcmxjghvvkdfmr.supabase.co/functions/v1/auto-reminder?token=e788fbb41c5e8638dd52bcbde35e37cf',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  ) as request_id;
  $$
);

-- Verificar que quedó programado
select jobname, schedule, active from cron.job where jobname = 'auto-reminder-daily';
