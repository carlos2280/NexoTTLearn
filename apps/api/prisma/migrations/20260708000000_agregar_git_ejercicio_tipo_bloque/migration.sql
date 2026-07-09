-- Anade GIT_EJERCICIO al enum TipoBloque para el bloque ejecutable de git
-- (terminal + simulador de git en memoria en el navegador). Es un bloque
-- autocontenido (esEvaluable=false); disenado para poder volverse evaluable
-- en el futuro sin cambiar el modelo de datos.
--
-- Cambio aditivo: ningun bloque existente se invalida. PostgreSQL exige que
-- `ALTER TYPE ... ADD VALUE` no corra dentro de una transaccion explicita;
-- Prisma respeta esto automaticamente.

ALTER TYPE "tipo_bloque_enum" ADD VALUE IF NOT EXISTS 'GIT_EJERCICIO';
