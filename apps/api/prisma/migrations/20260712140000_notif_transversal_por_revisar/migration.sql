-- Nuevo tipo de notificación admin: aviso "proyecto transversal por revisar"
-- cuando un intento pasa a EVALUADO. Aditivo (ADD VALUE), no rompe nada.
ALTER TYPE "tipo_evento_notif_enum" ADD VALUE IF NOT EXISTS 'TRANSVERSAL_POR_REVISAR';
