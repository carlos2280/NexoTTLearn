-- CreateEnum
CREATE TYPE "archivo_tipo_enum" AS ENUM ('EVALUACION_INICIAL_EXCEL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "accion_auditoria_enum" ADD VALUE 'EVALUACION_TEMPLATE_DESCARGADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'EVALUACION_PREVIEW_CREADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'EVALUACION_PREVIEW_DESCARTADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'EVALUACION_APLICADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'NOTA_SKILL_EDITADA_MANUALMENTE';

-- CreateTable
CREATE TABLE "archivos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "archivo_tipo_enum" NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "tamanio_bytes" INTEGER NOT NULL,
    "subido_por_usuario_id" UUID NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "previews_evaluacion_inicial" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curso_id" UUID NOT NULL,
    "archivo_id" UUID NOT NULL,
    "creado_por_usuario_id" UUID NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "aplicado_en" TIMESTAMPTZ(6),
    "aplicado_por_carga_id" UUID,
    "resumen" JSONB NOT NULL,
    "cambios" JSONB NOT NULL,
    "rechazos" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "previews_evaluacion_inicial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargas_evaluacion_inicial" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curso_id" UUID NOT NULL,
    "preview_id" UUID NOT NULL,
    "archivo_id" UUID NOT NULL,
    "aplicado_por_usuario_id" UUID NOT NULL,
    "skills_actualizadas" INTEGER NOT NULL DEFAULT 0,
    "colaboradores_actualizados" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargas_evaluacion_inicial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_status" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("scope","key","usuario_id")
);

-- CreateIndex
CREATE INDEX "idx_archivos_subido_por" ON "archivos"("subido_por_usuario_id");

-- CreateIndex
CREATE INDEX "idx_archivos_tipo_fecha" ON "archivos"("tipo", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_previews_eval_inicial_curso" ON "previews_evaluacion_inicial"("curso_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_previews_eval_inicial_expira" ON "previews_evaluacion_inicial"("expira_en");

-- CreateIndex
CREATE UNIQUE INDEX "cargas_evaluacion_inicial_preview_id_key" ON "cargas_evaluacion_inicial"("preview_id");

-- CreateIndex
CREATE INDEX "idx_cargas_eval_inicial_curso" ON "cargas_evaluacion_inicial"("curso_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_idempotency_keys_expira" ON "idempotency_keys"("expira_en");

-- CreateIndex
CREATE INDEX "idx_idempotency_keys_usuario" ON "idempotency_keys"("usuario_id");

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_subido_por_usuario_id_fkey" FOREIGN KEY ("subido_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previews_evaluacion_inicial" ADD CONSTRAINT "previews_evaluacion_inicial_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previews_evaluacion_inicial" ADD CONSTRAINT "previews_evaluacion_inicial_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "archivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previews_evaluacion_inicial" ADD CONSTRAINT "previews_evaluacion_inicial_creado_por_usuario_id_fkey" FOREIGN KEY ("creado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previews_evaluacion_inicial" ADD CONSTRAINT "previews_evaluacion_inicial_aplicado_por_carga_id_fkey" FOREIGN KEY ("aplicado_por_carga_id") REFERENCES "cargas_evaluacion_inicial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargas_evaluacion_inicial" ADD CONSTRAINT "cargas_evaluacion_inicial_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargas_evaluacion_inicial" ADD CONSTRAINT "cargas_evaluacion_inicial_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "archivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargas_evaluacion_inicial" ADD CONSTRAINT "cargas_evaluacion_inicial_aplicado_por_usuario_id_fkey" FOREIGN KEY ("aplicado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
