-- CreateIndex
CREATE INDEX "idx_cargas_eval_inicial_archivo" ON "cargas_evaluacion_inicial"("archivo_id");

-- CreateIndex
CREATE INDEX "idx_cargas_eval_inicial_aplicado_por" ON "cargas_evaluacion_inicial"("aplicado_por_usuario_id");

-- CreateIndex
CREATE INDEX "idx_previews_eval_inicial_archivo" ON "previews_evaluacion_inicial"("archivo_id");

-- CreateIndex
CREATE INDEX "idx_previews_eval_inicial_creado_por" ON "previews_evaluacion_inicial"("creado_por_usuario_id");

-- CreateIndex
CREATE INDEX "idx_previews_eval_inicial_aplicado_por_carga" ON "previews_evaluacion_inicial"("aplicado_por_carga_id");
