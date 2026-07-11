-- Colapso del proyecto transversal a UNA sola capa (revisión con IA = capa
-- cualitativa). Tests-fijo y comprensión (auto-entrevista) dejan de evaluar.
--
-- 1) Cambia los DEFAULT de columna para que los transversales nuevos nazcan en
--    una sola capa.
-- 2) Normaliza los transversales EXISTENTES al mismo estado, para que sus
--    intentos puedan transicionar a EVALUADO con solo la nota cualitativa
--    (si quedaran capas activas sin cargador, el intento se colgaría).
--
-- Tabla de configuración pequeña (una fila por curso): el UPDATE es barato.

ALTER TABLE "proyectos_transversales"
  ALTER COLUMN "peso_capa_tests" SET DEFAULT 0.00,
  ALTER COLUMN "peso_capa_cualitativa" SET DEFAULT 100.00,
  ALTER COLUMN "peso_capa_comprension" SET DEFAULT 0.00,
  ALTER COLUMN "capa_tests_activa" SET DEFAULT false,
  ALTER COLUMN "capa_comprension_activa" SET DEFAULT false;

UPDATE "proyectos_transversales"
SET "capa_tests_activa"       = false,
    "capa_comprension_activa" = false,
    "capa_cualitativa_activa" = true,
    "peso_capa_tests"         = 0.00,
    "peso_capa_cualitativa"   = 100.00,
    "peso_capa_comprension"   = 0.00;
