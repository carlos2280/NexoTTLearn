-- Slice 6 / P6a — Foundation de asignaciones (aditiva, zero-downtime).
--
-- D-AS-2: 9 valores nuevos en `accion_auditoria_enum` para los eventos del
--         dominio asignaciones (alta admin batch, conversion voluntario→asignado,
--         transiciones de estado, resultado entrevista cliente, autoinscripcion).
-- D-AS-3: 2 CHECK constraints declarados en modelo fisico §3.23 que no estaban
--         aplicados. La tabla `asignaciones_curso` esta vacia (verificado en
--         snapshot inicial del slice) — no hay backfill que hacer.
-- D-AS-4: 1 indice parcial que Prisma no soporta declarativamente
--         (`@@index` no admite cl ausula WHERE).
--
-- IF NOT EXISTS en los ALTER TYPE permite reaplicar la migracion sin error si
-- alguno de los valores ya fue agregado fuera de banda. Patron heredado del
-- cierre de P5 (FIX-P5-cierre con enums similares).

ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'ASIGNACION_CREADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'ASIGNACION_CONVERTIDA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'ASIGNACION_INICIADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'ASIGNACION_LISTA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'ASIGNACION_CERRADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'ASIGNACION_REABIERTA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'ASIGNACION_RETIRADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'RESULTADO_ENTREVISTA_CLIENTE_REGISTRADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'VOLUNTARIO_AUTOINSCRITO';

-- CHECK constraints del modelo fisico §3.23. Defensa en profundidad: aseguran
-- la coherencia rol/estado/origen aun si la logica de aplicacion fallase.

ALTER TABLE "asignaciones_curso"
  ADD CONSTRAINT "chk_asig_rol_estado" CHECK (
    (rol = 'ASIGNADO' AND estado_asignado IS NOT NULL
                       AND estado_voluntario IS NULL
                       AND origen_voluntario IS NULL)
    OR
    (rol = 'VOLUNTARIO' AND estado_voluntario IS NOT NULL
                         AND estado_asignado IS NULL
                         AND origen_voluntario IS NOT NULL)
  );

ALTER TABLE "asignaciones_curso"
  ADD CONSTRAINT "chk_asig_resultado_solo_asignado" CHECK (
    rol = 'ASIGNADO' OR resultado_entrevista_cliente IS NULL
  );

-- Indice parcial para listados frecuentes filtrados por (curso, estado_asignado)
-- restringidos al rol=ASIGNADO. Prisma 6 no soporta WHERE en @@index, asi que
-- se aplica via SQL raw y se documenta en el schema con un comentario.

CREATE INDEX "idx_asignaciones_estado_asignado"
  ON "asignaciones_curso" ("curso_id", "estado_asignado")
  WHERE rol = 'ASIGNADO';
