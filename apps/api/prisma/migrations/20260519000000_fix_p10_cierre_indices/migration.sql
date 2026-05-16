-- =============================================================================
-- FIX-P10-cierre §5.122 — reconcilia drift del indice declarado por Prisma.
--
-- schema.prisma declara `@@index([estado], map: "idx_intentos_transversal_estado_no_anulado")`
-- (indice plano sobre `estado`). En entornos donde el indice no fue creado
-- la sincronizacion via `prisma migrate dev` contamina al equipo. Esta
-- migracion lo materializa de forma 100% aditiva e idempotente.
--
-- La migracion 20260515000000_slice_8_transversal_anulado_estado creo en su
-- momento un indice PARCIAL con el mismo nombre (WHERE anulado = false). En
-- entornos que aplicaron aquella migracion el indice ya existe y este
-- `CREATE INDEX IF NOT EXISTS` es no-op; en entornos donde nunca se creo se
-- materializa el indice plano que el schema espera. NO se hace DROP del
-- parcial: la migracion es estrictamente aditiva.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_intentos_transversal_estado_no_anulado
  ON intentos_transversal (estado);
