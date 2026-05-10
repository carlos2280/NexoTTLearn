-- ============================================================================
-- Invariantes 🟢 DB del schema v2.
-- Fuente: DOCUMENTOS/doc/v2/2-datos/INVARIANTES-DB.md
--
-- Esta migración añade los constraints que Prisma no puede expresar nativamente:
--   · I1  · partial unique index (Inscripcion ACTIVA)
--   · I2  · XOR (EntregaProyecto: mini o transversal, no ambos)
--   · I3  · coherencia archivadoAt ↔ archivadoEstado (Modulo, Seccion, Bloque)
--   · I4  · pesos en rango [0, 100]
--   · I5  · notas en rango [0, 100]
--   · I6  · umbrales del curso coherentes (Excelencia > Aprobado > EnDesarrollo)
--   · I7  · suma de pesos = 100 ±0.01 (solo donde cabe en una sola fila)
--
-- I14 (revoke UPDATE/DELETE en LogActividad) se difiere a una migración
-- de infraestructura: requiere crear un rol de aplicación separado del rol
-- DBA y reconfigurar DATABASE_URL. Pendiente cerca de prod.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- I1 · Una sola Inscripcion ACTIVA por (participante, curso)
-- Origen: T01 · I2.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX "Inscripcion_unica_activa"
  ON "Inscripcion" ("participanteId", "cursoId")
  WHERE "estado" = 'ACTIVA';

-- ----------------------------------------------------------------------------
-- I2 · EntregaProyecto: XOR entre miniProyectoId y transversalId
-- Origen: MAESTRO §3.6.
-- ----------------------------------------------------------------------------
ALTER TABLE "EntregaProyecto"
  ADD CONSTRAINT "entrega_proyecto_xor" CHECK (
    ("miniProyectoId" IS NOT NULL AND "transversalId" IS NULL)
    OR
    ("miniProyectoId" IS NULL AND "transversalId" IS NOT NULL)
  );

-- ----------------------------------------------------------------------------
-- I3 · Coherencia archivadoAt ↔ archivadoEstado
-- Origen: T01 — soft delete.
-- ----------------------------------------------------------------------------
ALTER TABLE "Modulo"
  ADD CONSTRAINT "modulo_archivado_coherente" CHECK (
    ("archivadoAt" IS NULL AND "archivadoEstado" IS NULL)
    OR
    ("archivadoAt" IS NOT NULL AND "archivadoEstado" = 'ARCHIVADO')
  );

ALTER TABLE "Seccion"
  ADD CONSTRAINT "seccion_archivado_coherente" CHECK (
    ("archivadoAt" IS NULL AND "archivadoEstado" IS NULL)
    OR
    ("archivadoAt" IS NOT NULL AND "archivadoEstado" = 'ARCHIVADO')
  );

ALTER TABLE "Bloque"
  ADD CONSTRAINT "bloque_archivado_coherente" CHECK (
    ("archivadoAt" IS NULL AND "archivadoEstado" IS NULL)
    OR
    ("archivadoAt" IS NOT NULL AND "archivadoEstado" = 'ARCHIVADO')
  );

-- ----------------------------------------------------------------------------
-- I4 · Pesos en rango [0, 100]
-- Origen: T04 — rangos individuales.
-- ----------------------------------------------------------------------------
ALTER TABLE "Curso"
  ADD CONSTRAINT "curso_pesos_rango" CHECK (
    "pesoAreas"               BETWEEN 0 AND 100 AND
    "pesoProyectoTransversal" BETWEEN 0 AND 100 AND
    "pesoEntrevistaIA"        BETWEEN 0 AND 100 AND
    "pesoActividades"         BETWEEN 0 AND 100 AND
    "pesoMiniProyecto"        BETWEEN 0 AND 100
  );

ALTER TABLE "CursoArea"
  ADD CONSTRAINT "curso_area_peso_rango" CHECK ("peso" BETWEEN 0 AND 100);

ALTER TABLE "MiniProyecto"
  ADD CONSTRAINT "mini_pesos_capas_rango" CHECK (
    "pesoCapa1" BETWEEN 0 AND 100 AND
    "pesoCapa2" BETWEEN 0 AND 100 AND
    "pesoCapa3" BETWEEN 0 AND 100
  );

ALTER TABLE "ProyectoTransversal"
  ADD CONSTRAINT "transversal_pesos_capas_rango" CHECK (
    "pesoCapa1" BETWEEN 0 AND 100 AND
    "pesoCapa2" BETWEEN 0 AND 100 AND
    "pesoCapa3" BETWEEN 0 AND 100
  );

ALTER TABLE "RubricaEntrevistaItem"
  ADD CONSTRAINT "rubrica_peso_rango" CHECK ("peso" BETWEEN 0 AND 100);

ALTER TABLE "EntregaProyecto"
  ADD CONSTRAINT "entrega_proyecto_pesos_aplicados_rango" CHECK (
    ("pesoCapa1Aplicado" IS NULL OR "pesoCapa1Aplicado" BETWEEN 0 AND 100) AND
    ("pesoCapa2Aplicado" IS NULL OR "pesoCapa2Aplicado" BETWEEN 0 AND 100) AND
    ("pesoCapa3Aplicado" IS NULL OR "pesoCapa3Aplicado" BETWEEN 0 AND 100)
  );

-- ----------------------------------------------------------------------------
-- I5 · Notas en rango [0, 100]
-- Origen: MAESTRO §17.9 — escala única.
-- ----------------------------------------------------------------------------
ALTER TABLE "EvaluacionInicial"
  ADD CONSTRAINT "eval_inicial_puntaje_rango" CHECK ("puntaje" BETWEEN 0 AND 100);

ALTER TABLE "EntregaBloque"
  ADD CONSTRAINT "entrega_bloque_nota_rango" CHECK (
    "nota" IS NULL OR "nota" BETWEEN 0 AND 100
  );

ALTER TABLE "EntregaProyecto"
  ADD CONSTRAINT "entrega_proyecto_notas_rango" CHECK (
    ("notaCapa1" IS NULL OR "notaCapa1" BETWEEN 0 AND 100) AND
    ("notaCapa2" IS NULL OR "notaCapa2" BETWEEN 0 AND 100) AND
    ("notaCapa3" IS NULL OR "notaCapa3" BETWEEN 0 AND 100) AND
    ("notaFinal" IS NULL OR "notaFinal" BETWEEN 0 AND 100)
  );

ALTER TABLE "EntrevistaIASesion"
  ADD CONSTRAINT "entrevista_score_rango" CHECK (
    "scoreGeneral" IS NULL OR "scoreGeneral" BETWEEN 0 AND 100
  );

ALTER TABLE "ExpedienteEntry"
  ADD CONSTRAINT "expediente_nota_global_rango" CHECK ("notaGlobal" BETWEEN 0 AND 100);

ALTER TABLE "ExpedienteEntryArea"
  ADD CONSTRAINT "expediente_area_puntaje_rango" CHECK ("puntaje" BETWEEN 0 AND 100);

-- ----------------------------------------------------------------------------
-- I6 · Umbrales del curso coherentes
-- Origen: MAESTRO §6.2, §9.8.
-- ----------------------------------------------------------------------------
ALTER TABLE "Curso"
  ADD CONSTRAINT "curso_umbrales_coherentes" CHECK (
    "umbralExcelencia"   > "umbralAprobado" AND
    "umbralAprobado"     > "umbralEnDesarrollo" AND
    "umbralExcelencia"   BETWEEN 0 AND 100 AND
    "umbralEnDesarrollo" >= 0
  );

-- ----------------------------------------------------------------------------
-- I7 · Suma pesos = 100 ±0.01 (donde caben en una sola fila)
-- Origen: T04.
-- Excepciones (validación en aplicación, no en BD):
--   · CursoArea.peso (cruza filas).
--   · RubricaEntrevistaItem.peso (cruza filas).
-- ----------------------------------------------------------------------------
ALTER TABLE "Curso"
  ADD CONSTRAINT "curso_pesos_nivel_curso_suman_100" CHECK (
    abs(("pesoAreas" + "pesoProyectoTransversal" + "pesoEntrevistaIA") - 100) <= 0.01
  );

ALTER TABLE "Curso"
  ADD CONSTRAINT "curso_pesos_intra_modulo_suman_100" CHECK (
    abs(("pesoActividades" + "pesoMiniProyecto") - 100) <= 0.01
  );

ALTER TABLE "MiniProyecto"
  ADD CONSTRAINT "mini_pesos_3_capas_suman_100" CHECK (
    abs(("pesoCapa1" + "pesoCapa2" + "pesoCapa3") - 100) <= 0.01
  );

ALTER TABLE "ProyectoTransversal"
  ADD CONSTRAINT "transversal_pesos_3_capas_suman_100" CHECK (
    abs(("pesoCapa1" + "pesoCapa2" + "pesoCapa3") - 100) <= 0.01
  );
