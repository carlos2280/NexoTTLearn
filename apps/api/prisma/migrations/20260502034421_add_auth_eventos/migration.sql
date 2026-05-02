-- CreateEnum
CREATE TYPE "AuthEventoTipo" AS ENUM ('LOGIN_OK', 'LOGIN_FALLIDO', 'LOGIN_BLOQUEADO', 'MFA_SETUP_INICIADO', 'MFA_ACTIVADO', 'MFA_VERIFICADO', 'MFA_FALLIDO', 'PASSWORD_CAMBIADO', 'LOGOUT');

-- CreateTable
CREATE TABLE "auth_eventos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "email" TEXT,
    "tipo" "AuthEventoTipo" NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_eventos_usuario_id_creado_en_idx" ON "auth_eventos"("usuario_id", "creado_en");

-- CreateIndex
CREATE INDEX "auth_eventos_tipo_creado_en_idx" ON "auth_eventos"("tipo", "creado_en");

-- AddForeignKey
ALTER TABLE "auth_eventos" ADD CONSTRAINT "auth_eventos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
