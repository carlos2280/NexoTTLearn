-- ============================================================================
-- Aditivo · TipoAccionLog · acciones de Curso que faltaban (iter 1.5).
--
-- Origen: cierre de la iteración 1 backend de cursos. Las mutaciones
-- crear/duplicar/actualizar/actualizarAreas no tenían valor de enum y, además,
-- el cambio de pesos en ACTIVO debía señalizar "recálculo pendiente" en lugar
-- de reusar PESOS_CAMBIADOS_RETROACTIVO (que ya tiene semántica propia).
--
-- Postgres permite ALTER TYPE ... ADD VALUE de forma transaccional desde la
-- 12, pero requiere que cada ADD VALUE viva en su propia statement. Por eso
-- los listamos individualmente.
-- ============================================================================

ALTER TYPE "TipoAccionLog" ADD VALUE 'CURSO_CREADO';
ALTER TYPE "TipoAccionLog" ADD VALUE 'CURSO_ACTUALIZADO';
ALTER TYPE "TipoAccionLog" ADD VALUE 'CURSO_DUPLICADO';
ALTER TYPE "TipoAccionLog" ADD VALUE 'CURSO_AREAS_ACTUALIZADAS';
ALTER TYPE "TipoAccionLog" ADD VALUE 'CURSO_PESOS_RECALCULO_PENDIENTE';
