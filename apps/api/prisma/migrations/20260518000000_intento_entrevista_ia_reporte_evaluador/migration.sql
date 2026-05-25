-- Aditiva pura: nueva columna JSONB nullable. Sin backfill.
-- Estructura esperada del payload:
--   { "fortalezas": string[], "mejoras": string[], "justificacion": string,
--     "generadoEn": ISO8601 }
-- Los intentos previos a esta migracion quedan en NULL; la pantalla admin
-- renderiza un placeholder ("sin reporte disponible").
ALTER TABLE "intentos_entrevista_ia"
  ADD COLUMN "reporte_evaluador" JSONB;
