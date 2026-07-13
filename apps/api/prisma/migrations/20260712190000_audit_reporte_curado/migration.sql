-- Nueva acción de auditoría: el admin cura el informe final del transversal (lo
-- que verá el participante), Fase 4b ③ / A09. Aditivo (ADD VALUE), no rompe nada.
-- El valor no se usa en esta misma migración (requisito de PG16 para ALTER TYPE).
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'INTENTO_TRANSVERSAL_REPORTE_CURADO';
