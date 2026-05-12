-- Slice 11 P11c — Infraestructura para reportes estrategicos.
--
-- Migracion 100% aditiva (D-S11-C1, D-S11-C2, D-S11-C4 + DE-P11c-1):
--   1. Enum `tipo_reporte_cache_enum`.
--   2. Tabla `reporte_cache` (lookup por scope_hash, payload jsonb).
--   3. Extension de tabla existente `consultas_logs` con columnas de negocio
--      (endpoint, query_params, latencia_ms) y dos indices para auditoria por
--      usuario / endpoint. Columnas legacy (`tipo_log`, `filtros`) se mantienen
--      intactas y son duplicadas por el service hasta §5.129 (cleanup).
--
-- Restricciones cumplidas: 0 DROP, 0 RENAME, 0 ALTER COLUMN.
-- Idempotencia via `IF NOT EXISTS` / `DO ... EXCEPTION WHEN duplicate_object`.

-- 1) Enum aditivo --------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "tipo_reporte_cache_enum" AS ENUM (
    'EFICACIA_PLATAFORMA',
    'HISTORICO_CLIENTE',
    'INVENTARIO_SKILLS',
    'REUTILIZACION_CATALOGO'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 2) Tabla reporte_cache -------------------------------------------------------
CREATE TABLE IF NOT EXISTS "reporte_cache" (
  "id"          uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  "tipo"        "tipo_reporte_cache_enum"  NOT NULL,
  "scope_hash"  text                       NOT NULL UNIQUE,
  "scope"       jsonb                      NOT NULL,
  "payload"     jsonb                      NOT NULL,
  "generada_at" timestamptz(6)             NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_reporte_cache_tipo_generada"
  ON "reporte_cache" ("tipo", "generada_at" DESC);

-- 3) Extension de consultas_logs (existente desde init) ------------------------
ALTER TABLE "consultas_logs"
  ADD COLUMN IF NOT EXISTS "endpoint"     text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "query_params" jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "latencia_ms"  integer NULL;

CREATE INDEX IF NOT EXISTS "consultas_logs_autor_usuario_id_fecha_idx"
  ON "consultas_logs" ("autor_usuario_id", "fecha" DESC);

CREATE INDEX IF NOT EXISTS "consultas_logs_endpoint_fecha_idx"
  ON "consultas_logs" ("endpoint", "fecha" DESC);
