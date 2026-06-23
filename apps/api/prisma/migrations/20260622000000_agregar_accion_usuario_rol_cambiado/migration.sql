-- D-PERSONAS: cambio de rol de usuario desde el panel de administracion.
-- Anade un valor nuevo al enum `accion_auditoria_enum`:
--   * USUARIO_ROL_CAMBIADO — registra cada cambio de rol (ADMIN <-> PARTICIPANTE)
--                            ejecutado por un admin sobre la cuenta de otro
--                            colaborador. Metadata: rolAnterior, rolNuevo, motivo
--                            (OWASP A09 — accion de alto valor, auditable).
-- Operacion aditiva. PostgreSQL ejecuta `ALTER TYPE ... ADD VALUE` fuera de
-- transaccion automaticamente.
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'USUARIO_ROL_CAMBIADO';
