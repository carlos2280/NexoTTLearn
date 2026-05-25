-- Anade el valor DIAGRAMA al enum TipoBloque para permitir bloques
-- pedagogicos del tipo "diagrama" (Excalidraw embebido).
--
-- Cambio aditivo: ningun bloque existente se invalida. PostgreSQL exige
-- que `ALTER TYPE ... ADD VALUE` no corra dentro de una transaccion
-- explicita; Prisma respeta esto automaticamente.

ALTER TYPE "tipo_bloque_enum" ADD VALUE IF NOT EXISTS 'DIAGRAMA';
