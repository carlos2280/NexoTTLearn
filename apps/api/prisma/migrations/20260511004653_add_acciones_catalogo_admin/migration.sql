-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "accion_auditoria_enum" ADD VALUE 'AREA_CREADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'AREA_ACTUALIZADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'AREA_ELIMINADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SKILL_CREADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SKILL_RENOMBRADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SKILL_ARCHIVADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SKILL_DESARCHIVADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SKILL_ELIMINADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SKILL_CAMBIO_AREA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SKILL_FUSIONADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MODULO_CREADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MODULO_ACTUALIZADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MODULO_ARCHIVADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MODULO_DESARCHIVADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MODULO_ELIMINADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'MODULO_HUERFANO_DETECTADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SECCION_CREADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SECCION_ACTUALIZADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SECCION_REORDENADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'SECCION_ELIMINADA';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'BLOQUE_CREADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'BLOQUE_EDITADO_COSMETICO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'BLOQUE_EDITADO_EVALUACION';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'BLOQUE_REORDENADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'BLOQUE_ELIMINADO_SOFT';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'CLIENTE_CREADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'CLIENTE_ACTUALIZADO';
ALTER TYPE "accion_auditoria_enum" ADD VALUE 'CLIENTE_ELIMINADO';
