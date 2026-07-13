-- Lista opcional de criterios explícitos "a evaluar" del proyecto transversal.
-- Aditiva y nullable: los transversales existentes quedan con NULL (= sin lista),
-- comportamiento idéntico al previo.
ALTER TABLE "proyectos_transversales"
  ADD COLUMN "criterios_evaluacion" JSONB;
