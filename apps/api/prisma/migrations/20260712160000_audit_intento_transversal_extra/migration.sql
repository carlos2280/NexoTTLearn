-- Nueva acción de auditoría: el admin otorga +1 intento del transversal a una
-- asignación (Fase 4b ②). Aditivo (ADD VALUE), no rompe nada. El valor no se
-- usa en esta misma migración (requisito de PG16 para ALTER TYPE ... ADD VALUE).
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'INTENTO_TRANSVERSAL_EXTRA_OTORGADO';
