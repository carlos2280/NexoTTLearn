-- Slice 8 P8c — Entrevista IA: nuevas acciones de auditoria (D-S8-A3, D-S8-D6).
--
-- Migracion estrictamente aditiva: solo `ALTER TYPE accion_auditoria_enum ADD
-- VALUE IF NOT EXISTS`. Sin DDL sobre tablas. Zero-downtime: `ADD VALUE` es no
-- bloqueante en PostgreSQL 12+; no toca filas existentes.
--
-- Los 4 valores cubren el ciclo completo de un intento de entrevista IA:
--   - INTENTO_ENTREVISTA_IA_CREADO     -> POST .../intentos-entrevista-ia
--   - INTENTO_ENTREVISTA_IA_FINALIZADO -> POST .../finalizar (nota + replicacion D33)
--   - INTENTO_ENTREVISTA_IA_AJUSTADO   -> POST .../ajustar (admin + X-Motivo)
--   - INTENTO_ENTREVISTA_IA_ANULADO    -> POST .../anular (admin + X-Motivo + idempotency)

ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_ENTREVISTA_IA_CREADO';
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_ENTREVISTA_IA_FINALIZADO';
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_ENTREVISTA_IA_AJUSTADO';
ALTER TYPE accion_auditoria_enum ADD VALUE IF NOT EXISTS 'INTENTO_ENTREVISTA_IA_ANULADO';
