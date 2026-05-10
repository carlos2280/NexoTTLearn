-- CreateEnum
CREATE TYPE "rol_usuario_enum" AS ENUM ('ADMIN', 'PARTICIPANTE');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "rol" "rol_usuario_enum" NOT NULL DEFAULT 'PARTICIPANTE';
