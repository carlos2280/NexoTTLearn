-- Slice 7 / P7b — Auditoria intentos y mejor-intento unico (aditiva, zero-downtime).
--
-- D-S7-A3: 3 valores nuevos en accion_auditoria_enum para los eventos del
--          dominio plan + intentos (recalcular plan, ajuste manual, invalidar).
-- D-S7-C3: indice unico parcial garantiza UN solo mejor-intento vigente por
--          (colaborador, bloque). Race-safety final si la logica aplicativa
--          fallara (D13). Prisma no soporta WHERE en @@unique/@@index — SQL raw.
--
-- IF NOT EXISTS en los ALTER TYPE y en el CREATE UNIQUE INDEX permite reaplicar
-- la migracion sin error si alguno de los objetos ya fue agregado fuera de
-- banda. Patron heredado de P6a.

ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'PLAN_RECALCULADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'PLAN_AJUSTADO_MANUALMENTE';
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'INTENTO_BLOQUE_INVALIDADO';

CREATE UNIQUE INDEX IF NOT EXISTS "uq_intentos_bloque_mejor"
  ON "intentos_bloque" ("colaborador_id", "bloque_id")
  WHERE "es_mejor_intento" = true AND "esta_invalidado" = false;
