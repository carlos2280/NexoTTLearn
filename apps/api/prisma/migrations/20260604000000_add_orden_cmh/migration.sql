-- Añade orden explicito a la habilitacion de modulos por curso.
-- Reemplaza la ordenacion fragil por titulo (`localeCompare`) por un campo
-- propio del vinculo curso↔modulo, controlable por el admin.

-- 1) Columna con default 0 para no romper inserts pendientes.
ALTER TABLE "cursos_modulos_habilitados"
  ADD COLUMN "orden" INTEGER NOT NULL DEFAULT 0;

-- 2) Backfill: asignar orden por curso preservando el orden visible actual
--    (alfabetico por titulo de modulo) para que la UI no salte al desplegar.
WITH ordenados AS (
  SELECT
    cmh.curso_id,
    cmh.modulo_id,
    ROW_NUMBER() OVER (
      PARTITION BY cmh.curso_id
      ORDER BY m.titulo
    ) - 1 AS nuevo_orden
  FROM "cursos_modulos_habilitados" cmh
  JOIN "modulos" m ON m.id = cmh.modulo_id
)
UPDATE "cursos_modulos_habilitados" cmh
SET "orden" = ordenados.nuevo_orden
FROM ordenados
WHERE ordenados.curso_id = cmh.curso_id
  AND ordenados.modulo_id = cmh.modulo_id;

-- 3) Unique + indice. Se aplica DEFERRABLE INITIALLY DEFERRED para permitir
--    reordenar dentro de una transaccion sin colisiones intermedias
--    (mismo patron que `uq_secciones_modulo_orden`).
ALTER TABLE "cursos_modulos_habilitados"
  ADD CONSTRAINT "uq_cmh_curso_orden" UNIQUE ("curso_id", "orden")
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX "idx_cmh_curso_orden"
  ON "cursos_modulos_habilitados" ("curso_id", "orden");
