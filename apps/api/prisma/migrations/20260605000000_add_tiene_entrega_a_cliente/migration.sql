-- Distingue cursos con "entrega a cliente" (perfil presentado a un cliente
-- externo via entrevista cliente) de cursos internos sin esa fase. Default
-- true preserva el comportamiento previo para los cursos existentes.

ALTER TABLE "cursos"
  ADD COLUMN "tiene_entrega_a_cliente" BOOLEAN NOT NULL DEFAULT true;
