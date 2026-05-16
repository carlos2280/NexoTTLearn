-- Slice 11 P11a — Cierre de curso + fotografia + CURSO_DEADLINE.
--
-- 100% aditiva, zero-downtime. Crea la tabla `cursos_fotografia_cierre`
-- (brecha 7.E5.2 del modelo fisico: snapshot oficial al cerrar un curso) y
-- anade la columna `log_cambio_curso_id` a `historico_estados_asignacion`
-- para soportar el "deshacer cierre" filtrando exactamente las asignaciones
-- afectadas por un cierre concreto (D-S11-A4 / R-S11-2).
--
-- El valor enum `CURSO_DEADLINE` de `tipo_evento_notif_enum` YA existe
-- desde la migracion `20260510060430_init`, por lo que NO se vuelve a
-- crear aqui (decision emergente registrada en P11a).
--
-- Todas las sentencias usan `IF NOT EXISTS` / `IF EXISTS` -> migracion
-- idempotente.

CREATE TABLE IF NOT EXISTS "cursos_fotografia_cierre" (
  "curso_id"         uuid PRIMARY KEY REFERENCES "cursos"("id") ON DELETE CASCADE,
  "fecha_cierre"     timestamptz NOT NULL,
  "snapshot"         jsonb NOT NULL,
  "version_snapshot" integer NOT NULL DEFAULT 1,
  "descartada"       boolean NOT NULL DEFAULT false,
  "descartada_at"    timestamptz NULL
);

CREATE INDEX IF NOT EXISTS "idx_fotografia_no_descartada"
  ON "cursos_fotografia_cierre" ("curso_id")
  WHERE "descartada" = false;

ALTER TABLE "historico_estados_asignacion"
  ADD COLUMN IF NOT EXISTS "log_cambio_curso_id" uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'historico_estados_asignacion'
      AND constraint_name = 'historico_estados_asignacion_log_cambio_curso_id_fkey'
  ) THEN
    ALTER TABLE "historico_estados_asignacion"
      ADD CONSTRAINT "historico_estados_asignacion_log_cambio_curso_id_fkey"
      FOREIGN KEY ("log_cambio_curso_id")
      REFERENCES "log_cambios_curso"("id")
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_historico_log_cambio_curso"
  ON "historico_estados_asignacion" ("log_cambio_curso_id")
  WHERE "log_cambio_curso_id" IS NOT NULL;

ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'CURSO_CERRADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'CURSO_CIERRE_DESHECHO';
