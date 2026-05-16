-- Slice 8 / FIX-P8-cierre — Aditivos finales (zero-downtime, no destructivos).
--
-- Consolida 3 items emergentes detectados durante P8b/P8c, todos pospuestos al
-- cierre formal para mantener UN solo commit final (patron heredado FIX-P5/P6/
-- P7-cierre).
--
--  - §5.116: nuevo valor `INTENTO_TRANSVERSAL_CAPA_CARGADA` en
--            `accion_auditoria_enum` para auditar las cargas E7/E8/E9.
--  - §5.118: columna `fecha_finalizacion` en `intentos_transversal` para
--            ordenar correctamente la politica "ultimo aprobado" (D-S8-C5).
--            Hoy P8b ordenaba por `fecha` (creacion) — proxy aceptable mientras
--            no hubiera anulaciones, pero incorrecto si se anula el ultimo
--            FINALIZADO y vuelve a finalizarse despues.
--  - §5.119: columnas dedicadas en `intentos_entrevista_ia` para `estado`,
--            `fecha_finalizacion` y `secciones_base_snapshot`. P8c congelaba el
--            estado en `transcripcion_o_log` JSONB por falta de schema; ahora
--            la SoT pasa a columna dedicada + enum (mantenemos el JSONB como
--            sombra durante la transicion, eliminacion futura como deuda).
--
-- Estricta y aditiva: solo `ALTER TYPE ADD VALUE`, `ADD COLUMN IF NOT EXISTS`,
-- `CREATE TYPE`, `CREATE INDEX IF NOT EXISTS` y backfills idempotentes. Sin
-- DROP, RENAME, ALTER COLUMN TYPE ni ALTER COLUMN SET NOT NULL.

-- =============================================================================
-- 1. §5.116 — accion_auditoria_enum: INTENTO_TRANSVERSAL_CAPA_CARGADA
-- =============================================================================
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_TRANSVERSAL_CAPA_CARGADA';

-- =============================================================================
-- 2. §5.118 — intentos_transversal.fecha_finalizacion
-- =============================================================================
ALTER TABLE intentos_transversal
  ADD COLUMN IF NOT EXISTS fecha_finalizacion timestamptz NULL;

-- Backfill defensivo: para filas existentes ya FINALIZADAS marcamos
-- fecha_finalizacion = fecha (proxy monotonico D-EMERG-3 P8b). Idempotente:
-- solo actualiza filas con fecha_finalizacion aun NULL.
UPDATE intentos_transversal
  SET fecha_finalizacion = fecha
  WHERE estado = 'FINALIZADO' AND fecha_finalizacion IS NULL;

-- =============================================================================
-- 3. §5.119 — intentos_entrevista_ia: estado + fecha_finalizacion + snapshot
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intento_entrevista_ia_estado_enum') THEN
    CREATE TYPE intento_entrevista_ia_estado_enum AS ENUM (
      'EN_PROGRESO',
      'FINALIZADO',
      'ANULADO'
    );
  END IF;
END
$$;

ALTER TABLE intentos_entrevista_ia
  ADD COLUMN IF NOT EXISTS estado intento_entrevista_ia_estado_enum
    NOT NULL DEFAULT 'EN_PROGRESO';

ALTER TABLE intentos_entrevista_ia
  ADD COLUMN IF NOT EXISTS fecha_finalizacion timestamptz NULL;

ALTER TABLE intentos_entrevista_ia
  ADD COLUMN IF NOT EXISTS secciones_base_snapshot jsonb NULL;

-- Backfill desde transcripcion_o_log: P8c congelo el estado interno + el
-- snapshot dentro de `transcripcion_o_log` (D-EMERG-P8c-1/3). Migramos los
-- valores a columnas dedicadas para que la SoT pase a la columna. Idempotente:
-- solo toca filas cuyo snapshot dedicado aun sea NULL.
UPDATE intentos_entrevista_ia
  SET
    estado = COALESCE(
      NULLIF(transcripcion_o_log->>'estado', '')::intento_entrevista_ia_estado_enum,
      CASE
        WHEN anulado THEN 'ANULADO'::intento_entrevista_ia_estado_enum
        ELSE 'EN_PROGRESO'::intento_entrevista_ia_estado_enum
      END
    ),
    fecha_finalizacion = NULLIF(transcripcion_o_log->>'fechaFinalizacion', '')::timestamptz,
    secciones_base_snapshot = transcripcion_o_log->'seccionesBaseSnapshot'
  WHERE secciones_base_snapshot IS NULL;

CREATE INDEX IF NOT EXISTS idx_intentos_entrevista_ia_estado
  ON intentos_entrevista_ia (estado);
