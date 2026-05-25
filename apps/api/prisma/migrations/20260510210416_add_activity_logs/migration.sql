-- CreateEnum
CREATE TYPE "accion_auditoria_enum" AS ENUM ('LOGIN_OK', 'LOGIN_FAIL', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_REGENERATED', 'USUARIO_DESBLOQUEADO', 'SESION_ELIMINADA', 'COLABORADOR_CREADO', 'AVISO_ACEPTADO');

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "accion" "accion_auditoria_enum" NOT NULL,
    "exito" BOOLEAN NOT NULL,
    "recurso_tipo" TEXT,
    "recurso_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_activity_logs_usuario" ON "activity_logs"("usuario_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_accion" ON "activity_logs"("accion", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
