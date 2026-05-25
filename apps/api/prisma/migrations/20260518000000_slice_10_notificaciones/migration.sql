-- Slice 10 P10a — Notificaciones: completar foundation.
--
-- 100% aditiva, zero-downtime. Las tablas y enums (`notificaciones`,
-- `notificaciones_canales`, `preferencias_notificacion`, `tipo_evento_notif_enum`,
-- `canal_notif_enum`) ya existen desde la migracion `20260510060430_init`.
-- Esta migracion solo cierra los items pendientes documentados en
-- modelo_fisico.md §3.37 y el design doc 2026-05-12-slice-10-notificaciones.md:
--
--   1. Indice parcial `idx_notif_usuario_no_leidas` — soporta `GET /notificaciones/badge`.
--   2. Indice parcial `idx_notif_archivar` — soporta el cron diario de archivado a 30 dias.
--   3. Valor enum `PREFERENCIA_NOTIFICACION_ACTUALIZADA` para auditar el
--      PATCH /notificaciones/preferencias en P10b.
--
-- Todos los CREATE INDEX usan IF NOT EXISTS y el ALTER TYPE usa IF NOT EXISTS:
-- la migracion es idempotente.

CREATE INDEX IF NOT EXISTS "idx_notif_usuario_no_leidas"
  ON "notificaciones" ("usuario_id")
  WHERE "leida" = false AND "archivada" = false;

CREATE INDEX IF NOT EXISTS "idx_notif_archivar"
  ON "notificaciones" ("fecha_creacion")
  WHERE "archivada" = false;

ALTER TYPE "accion_auditoria_enum"
  ADD VALUE IF NOT EXISTS 'PREFERENCIA_NOTIFICACION_ACTUALIZADA';
