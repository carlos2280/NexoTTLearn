-- Anade IMAGEN_CONTENIDO al enum ArchivoTipo para las imagenes subidas desde
-- los editores de contenido (TipTap). Se guardan via StorageService en el
-- volumen persistente (Railway Volume en prod) y se sirven por su propio
-- endpoint, reutilizando el modelo `archivos` de evaluacion inicial.
--
-- Cambio aditivo: ningun archivo existente se invalida. PostgreSQL exige que
-- `ALTER TYPE ... ADD VALUE` no corra dentro de una transaccion explicita;
-- Prisma respeta esto automaticamente.

ALTER TYPE "archivo_tipo_enum" ADD VALUE IF NOT EXISTS 'IMAGEN_CONTENIDO';
