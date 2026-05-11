-- Slice 3 / Parte A — migracion aditiva, NO destructiva.
--
-- 1) `activity_logs.metadata`: payload JSONB opcional para enriquecer auditoria
--    de mutaciones administrativas. El AuditLogService persiste motivo y
--    cualquier metadato relevante de la accion (sin secretos, sin body crudo).
--    Nullable para retrocompatibilidad: filas previas quedan con NULL.
-- 2) `historico_renombrados_skill.motivo`: cierra §5.20 (P3a dejaba el motivo
--    del admin sin persistir en este historial). Nullable porque filas
--    historicas previas no tienen motivo conocido.

ALTER TABLE "activity_logs" ADD COLUMN "metadata" JSONB;
ALTER TABLE "historico_renombrados_skill" ADD COLUMN "motivo" TEXT;
