-- Nueva accion de auditoria: el admin ajusta la nota global del intento transversal
-- al publicar (traza de accountability de quien cambio el numero). Espejo de
-- `INTENTO_ENTREVISTA_IA_AJUSTADO`.
--
-- ADITIVO: `ADD VALUE IF NOT EXISTS` a un enum de Postgres no reordena ni borra
-- valores existentes; es no destructivo. En migracion propia (separada del ALTER
-- TABLE) por el requisito de PG de no usar el valor nuevo en la misma transaccion.
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'INTENTO_TRANSVERSAL_NOTA_AJUSTADA';
