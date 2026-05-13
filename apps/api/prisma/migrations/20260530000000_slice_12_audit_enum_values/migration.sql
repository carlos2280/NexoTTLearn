-- Slice 12 (P12) — D-S12-D1: ampliacion aditiva de AccionAuditoria.
-- Anade 3 valores nuevos al enum `accion_auditoria_enum`:
--   * FICHA_EXPORTADA          — sustituye el uso prestado de
--                                EVALUACION_TEMPLATE_DESCARGADO en el export
--                                de ficha autoservicio (D90 §20.3 / OWASP A09).
--   * PLAN_RECALCULADO_MASIVO  — sustituye el uso prestado de PLAN_RECALCULADO
--                                con metadata `tipo:"masivo"` en el recalculo
--                                batch del plan personal.
--   * AUDITORIA_EXPORTADA      — nuevo evento para auditar la exportacion CSV
--                                del visor de auditoria (D-S12-A6).
-- Operacion aditiva, idempotente por timestamp del directorio. PostgreSQL
-- ejecuta `ALTER TYPE ... ADD VALUE` fuera de transaccion automaticamente.
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'FICHA_EXPORTADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'PLAN_RECALCULADO_MASIVO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'AUDITORIA_EXPORTADA';
