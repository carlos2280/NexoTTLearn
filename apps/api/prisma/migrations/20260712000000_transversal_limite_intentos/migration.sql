-- Limite de intentos del proyecto transversal (Fase 1a).
-- Aditivo: columnas nuevas con default, sin backfill ni tablas nuevas.

-- Tope global de intentos por participante en cada transversal (default 3).
ALTER TABLE "proyectos_transversales"
  ADD COLUMN "intentos_max" INTEGER NOT NULL DEFAULT 3;

-- Intentos extra concedidos a un participante puntual (default 0).
ALTER TABLE "asignaciones_curso"
  ADD COLUMN "intentos_extra_transversal" INTEGER NOT NULL DEFAULT 0;
