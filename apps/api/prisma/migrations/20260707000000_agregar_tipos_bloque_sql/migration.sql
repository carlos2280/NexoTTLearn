-- Anade SQL_EJERCICIO y SQL_TESTS al enum TipoBloque para los bloques
-- ejecutables de SQL (editor + PGlite en el navegador). SQL_EJERCICIO es el
-- reto evaluable; SQL_TESTS es su hermano oculto con las consultas de
-- referencia, espejo de CODIGO_PREGUNTAS / CODIGO_TESTS.
--
-- Cambio aditivo: ningun bloque existente se invalida. PostgreSQL exige que
-- `ALTER TYPE ... ADD VALUE` no corra dentro de una transaccion explicita;
-- Prisma respeta esto automaticamente.

ALTER TYPE "tipo_bloque_enum" ADD VALUE IF NOT EXISTS 'SQL_EJERCICIO';
ALTER TYPE "tipo_bloque_enum" ADD VALUE IF NOT EXISTS 'SQL_TESTS';
