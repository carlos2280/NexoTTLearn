-- Curacion del informe del transversal (Fase 4b ③). Aditivo, no destructivo.
--   reporte_ia       : pre-informe crudo de la IA (inmutable, snapshot al evaluar).
--   evidencia_repo   : que leyo la IA del repo (commit, archivos, truncado, contenido)
--                      para que sobreviva aunque el alumno borre el repo.
--   reporte_final    : informe curado por el admin; lo unico que ve el participante.
--   validado_por     : Usuario admin que cerro la curacion (FK, SET NULL si se borra).
--   fecha_validacion : cuando se sello la validacion.
ALTER TABLE "intentos_transversal" ADD COLUMN "reporte_ia" JSONB;
ALTER TABLE "intentos_transversal" ADD COLUMN "evidencia_repo" JSONB;
ALTER TABLE "intentos_transversal" ADD COLUMN "reporte_final" JSONB;
ALTER TABLE "intentos_transversal" ADD COLUMN "validado_por" UUID;
ALTER TABLE "intentos_transversal" ADD COLUMN "fecha_validacion" TIMESTAMPTZ(6);

CREATE INDEX "idx_intentos_transversal_validado_por" ON "intentos_transversal"("validado_por");

ALTER TABLE "intentos_transversal"
  ADD CONSTRAINT "intentos_transversal_validado_por_fkey"
  FOREIGN KEY ("validado_por") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
