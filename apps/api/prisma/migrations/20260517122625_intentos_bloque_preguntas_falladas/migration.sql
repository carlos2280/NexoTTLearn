-- B-extra.2 punto 4 — preguntas falladas en intentos de bloque QUIZ.
--
-- Persistir la lista de `preguntaId` que el participante no acerto en este
-- intento permite al frontend mostrar la solucion solo en las falladas sin
-- recomputar la correccion en cliente (espejo fragil del server).
--
-- Aditiva, zero-downtime: columna nullable JSONB. Las filas existentes
-- quedan con NULL y el service backend devuelve `[]` (defensivo) al
-- mapear al response. El backend solo escribe la columna cuando el
-- bloque es de tipo QUIZ.
--
-- IF NOT EXISTS permite re-aplicar la migracion sin error.
ALTER TABLE "intentos_bloque"
  ADD COLUMN IF NOT EXISTS "preguntas_falladas" JSONB;
