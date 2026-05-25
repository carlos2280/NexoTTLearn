-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "accion_auditoria_enum" ADD VALUE 'LOGIN_PARCIAL_OK';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MFA_SETUP_INICIADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MFA_ENABLED';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MFA_VERIFY_OK';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MFA_VERIFY_FAIL';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MFA_DISABLED';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "requiere_setup_mfa" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "mfa_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "intentos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_mfa_challenges_usuario" ON "mfa_challenges"("usuario_id", "creado_en" DESC);

-- AddForeignKey
ALTER TABLE "mfa_challenges" ADD CONSTRAINT "mfa_challenges_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
