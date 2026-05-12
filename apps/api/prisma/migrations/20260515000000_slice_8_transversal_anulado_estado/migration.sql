-- Slice 8 / P8a — Transversal: foundation evaluacion asincrona (aditiva, zero-downtime).
--
-- D-S8-E1: Migracion aditiva unica del Slice 8. Cubre brechas 7.E5.1 (anulado +
--          motivo_anulacion), enum nuevo de estado EN_EVALUACION/EVALUADO/
--          FINALIZADO/ANULADO, columnas auxiliares para el flujo asincrono
--          (repo, comentario, notas por capa, nota_global) e indices preventivos.
--
-- Estricta y aditiva: sin DROPs ni RENAMEs. `IF NOT EXISTS` y `ADD VALUE IF NOT
-- EXISTS` permiten reaplicar la migracion sin error si alguno de los objetos ya
-- existe fuera de banda. Patron heredado de P6a/P7b.

-- =============================================================================
-- 1. Brecha 7.E5.1 — anulado + motivo_anulacion en intentos_transversal
-- =============================================================================
ALTER TABLE intentos_transversal
  ADD COLUMN IF NOT EXISTS anulado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_anulacion text NULL;

-- CHECK simetrico al de intentos_entrevista_ia: motivo obligatorio cuando anulado=true.
ALTER TABLE intentos_transversal
  DROP CONSTRAINT IF EXISTS chk_transversal_anulado_motivo;
ALTER TABLE intentos_transversal
  ADD CONSTRAINT chk_transversal_anulado_motivo
  CHECK (
    (anulado = false AND motivo_anulacion IS NULL)
    OR (anulado = true AND length(trim(motivo_anulacion)) > 0)
  );

-- =============================================================================
-- 2. Enum estado del intento transversal
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_intento_transversal_enum') THEN
    CREATE TYPE estado_intento_transversal_enum AS ENUM (
      'EN_EVALUACION',
      'EVALUADO',
      'FINALIZADO',
      'ANULADO'
    );
  END IF;
END
$$;

ALTER TABLE intentos_transversal
  ADD COLUMN IF NOT EXISTS estado estado_intento_transversal_enum
  NOT NULL DEFAULT 'EN_EVALUACION';

-- =============================================================================
-- 3. Columnas auxiliares del flujo asincrono (P8a)
--    - repo_url + comentario_colaborador: input del POST.
--    - nota_capa_tests/cualitativa/comprension: output del job (Decimal 5,2).
--    - nota_global: derivada al pasar a FINALIZADO (ponderada por pesos del transversal).
-- =============================================================================
ALTER TABLE intentos_transversal
  ADD COLUMN IF NOT EXISTS repo_url text NULL,
  ADD COLUMN IF NOT EXISTS comentario_colaborador text NULL,
  ADD COLUMN IF NOT EXISTS nota_capa_tests numeric(5, 2) NULL,
  ADD COLUMN IF NOT EXISTS nota_capa_cualitativa numeric(5, 2) NULL,
  ADD COLUMN IF NOT EXISTS nota_capa_comprension numeric(5, 2) NULL,
  ADD COLUMN IF NOT EXISTS nota_global numeric(5, 2) NULL;

-- Relajamos NOT NULL de nota y aprobado: el intento se crea en EN_EVALUACION
-- sin calificacion; el job rellena al pasar a EVALUADO/FINALIZADO. Aditiva.
ALTER TABLE intentos_transversal
  ALTER COLUMN nota DROP NOT NULL,
  ALTER COLUMN aprobado DROP NOT NULL;

-- =============================================================================
-- 4. Indices preventivos
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_intentos_transversal_estado_no_anulado
  ON intentos_transversal (estado) WHERE anulado = false;

CREATE INDEX IF NOT EXISTS idx_intentos_transversal_transversal_id
  ON intentos_transversal (transversal_id);

CREATE INDEX IF NOT EXISTS idx_intentos_transversal_colaborador_id
  ON intentos_transversal (colaborador_id);

-- =============================================================================
-- 5. accion_auditoria_enum — 4 valores nuevos para P8a/P8b
-- =============================================================================
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_TRANSVERSAL_CREADO';
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_TRANSVERSAL_FINALIZADO';
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_TRANSVERSAL_ANULADO';
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'TRANSVERSAL_SKILLS_ACTUALIZADAS';
