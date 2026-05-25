-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "estado_skill_enum" AS ENUM ('ACTIVA', 'ARCHIVADA');

-- CreateEnum
CREATE TYPE "estado_modulo_enum" AS ENUM ('ACTIVO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "tipo_bloque_enum" AS ENUM ('PARRAFO', 'TIP', 'VIDEO', 'RECURSO', 'CODIGO_ILUSTRATIVO', 'QUIZ', 'CODIGO_PREGUNTAS', 'CODIGO_TESTS');

-- CreateEnum
CREATE TYPE "estado_bloque_enum" AS ENUM ('ACTIVO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "estado_curso_enum" AS ENUM ('BORRADOR', 'ACTIVO', 'CERRADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "desbloqueo_curso_enum" AS ENUM ('ENCADENADO', 'SIEMPRE', 'DESDE_FECHA');

-- CreateEnum
CREATE TYPE "estado_empleado_enum" AS ENUM ('ACTIVO', 'EX_EMPLEADO');

-- CreateEnum
CREATE TYPE "rol_asignacion_enum" AS ENUM ('ASIGNADO', 'VOLUNTARIO');

-- CreateEnum
CREATE TYPE "origen_voluntario_enum" AS ENUM ('INICIATIVA', 'REUTILIZACION');

-- CreateEnum
CREATE TYPE "estado_asignado_enum" AS ENUM ('ASIGNADO', 'EN_PROGRESO', 'LISTO', 'APTO', 'NO_APTO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "estado_voluntario_enum" AS ENUM ('INSCRITO', 'EN_PROGRESO', 'LISTO', 'COMPLETADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "resultado_entrevista_cliente_enum" AS ENUM ('PENDIENTE', 'PASO', 'NO_PASO');

-- CreateEnum
CREATE TYPE "caracter_item_plan_enum" AS ENUM ('OBLIGATORIA', 'OPCIONAL');

-- CreateEnum
CREATE TYPE "razon_item_plan_enum" AS ENUM ('SKILL_FALTANTE', 'SKILL_CERCA', 'SKILL_YA_CUMPLE', 'AJUSTE_ADMIN');

-- CreateEnum
CREATE TYPE "origen_nota_skill_enum" AS ENUM ('ENTREVISTA_INICIAL', 'BLOQUE', 'TRANSVERSAL', 'ENTREVISTA_IA');

-- CreateEnum
CREATE TYPE "filosofia_entrevista_enum" AS ENUM ('PREPARACION', 'FILTRO');

-- CreateEnum
CREATE TYPE "profundidad_entrevista_enum" AS ENUM ('JUNIOR', 'SEMI_SENIOR', 'SENIOR');

-- CreateEnum
CREATE TYPE "tono_entrevista_enum" AS ENUM ('CONVERSACIONAL', 'FORMAL');

-- CreateEnum
CREATE TYPE "tipo_evento_notif_enum" AS ENUM ('ASIGNACION_CURSO', 'PLAN_RECALCULADO', 'TRANSVERSAL_DISPONIBLE', 'ENTREVISTA_IA_DISPONIBLE', 'RECORDATORIO_DEADLINE', 'CASO_REABIERTO', 'RESULTADO_CIERRE', 'CURSO_DEADLINE', 'COLABORADOR_LISTO', 'EXCEL_CARGADO', 'MODULO_HUERFANO_SKILL', 'PLANES_DESACTUALIZADOS', 'CENTRO_REVISION');

-- CreateEnum
CREATE TYPE "canal_notif_enum" AS ENUM ('IN_APP', 'CORREO');

-- CreateEnum
CREATE TYPE "modo_entrega_password_enum" AS ENUM ('MANUAL', 'AUTOMATICO');

-- CreateEnum
CREATE TYPE "accion_log_curso_enum" AS ENUM ('CAMBIO_AREAS', 'CAMBIO_PESOS', 'CAMBIO_OBJETIVOS', 'TOGGLE_TRANSVERSAL', 'TOGGLE_ENTREVISTA', 'CAMBIO_MODULOS', 'PUBLICACION', 'CIERRE', 'DESHACER_CIERRE', 'ARCHIVADO', 'OTRO');

-- CreateEnum
CREATE TYPE "accion_ajuste_plan_enum" AS ENUM ('AGREGAR', 'QUITAR', 'EXIMIR', 'CAMBIAR_CARACTER');

-- CreateTable
CREATE TABLE "areas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "etiqueta_visible" TEXT NOT NULL,
    "area_id" UUID NOT NULL,
    "estado" "estado_skill_enum" NOT NULL DEFAULT 'ACTIVA',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_renombrados_skill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etiqueta_anterior" TEXT NOT NULL,
    "etiqueta_nueva" TEXT NOT NULL,
    "autor_usuario_id" UUID NOT NULL,

    CONSTRAINT "historico_renombrados_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_cambios_area_skill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "area_anterior_id" UUID NOT NULL,
    "area_nueva_id" UUID NOT NULL,
    "autor_usuario_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "historico_cambios_area_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "estado_modulo_enum" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_estados_modulo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "modulo_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_anterior" "estado_modulo_enum" NOT NULL,
    "estado_nuevo" "estado_modulo_enum" NOT NULL,
    "autor_usuario_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "historico_estados_modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "modulo_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secciones_skills" (
    "seccion_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "secciones_skills_pkey" PRIMARY KEY ("seccion_id","skill_id")
);

-- CreateTable
CREATE TABLE "bloques" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seccion_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" "tipo_bloque_enum" NOT NULL,
    "es_evaluable" BOOLEAN NOT NULL,
    "skill_que_mide_id" UUID,
    "contenido" JSONB NOT NULL DEFAULT '{}',
    "estado" "estado_bloque_enum" NOT NULL DEFAULT 'ACTIVO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "datos_contacto" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" TEXT NOT NULL,
    "cliente_id" UUID NOT NULL,
    "estado" "estado_curso_enum" NOT NULL DEFAULT 'BORRADOR',
    "fecha_inicio" DATE NOT NULL,
    "fecha_deadline" DATE NOT NULL,
    "toggle_voluntarios" BOOLEAN NOT NULL DEFAULT true,
    "toggle_cierre_automatico" BOOLEAN NOT NULL DEFAULT false,
    "umbral_no_cumple" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "peso_bloques" DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    "peso_transversal" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "peso_entrevista" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "transversal_id" UUID,
    "entrevista_ia_id" UUID,
    "umbrales_logro" JSONB,
    "desbloqueo" "desbloqueo_curso_enum" NOT NULL DEFAULT 'ENCADENADO',
    "fecha_desbloqueo" DATE,
    "fecha_cierre" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos_areas_exigidas" (
    "curso_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,
    "puntaje_objetivo" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "cursos_areas_exigidas_pkey" PRIMARY KEY ("curso_id","area_id")
);

-- CreateTable
CREATE TABLE "cursos_skills_exigidas" (
    "curso_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "nota_minima" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "cursos_skills_exigidas_pkey" PRIMARY KEY ("curso_id","skill_id")
);

-- CreateTable
CREATE TABLE "cursos_modulos_habilitados" (
    "curso_id" UUID NOT NULL,
    "modulo_id" UUID NOT NULL,

    CONSTRAINT "cursos_modulos_habilitados_pkey" PRIMARY KEY ("curso_id","modulo_id")
);

-- CreateTable
CREATE TABLE "log_cambios_curso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curso_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autor_usuario_id" UUID NOT NULL,
    "accion" "accion_log_curso_enum" NOT NULL,
    "motivo" TEXT NOT NULL,
    "preview_impacto" JSONB,

    CONSTRAINT "log_cambios_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado_empleado" "estado_empleado_enum" NOT NULL DEFAULT 'ACTIVO',
    "fecha_off_boarding" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "colaborador_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_inicial_caduca" TIMESTAMPTZ(6),
    "requiere_cambio_password" BOOLEAN NOT NULL DEFAULT true,
    "mfa_habilitado" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_login" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_passwords" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "fecha_cambio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_passwords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "modo_entrega_password" "modo_entrega_password_enum" NOT NULL DEFAULT 'MANUAL',
    "resend_api_key_cifrada" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_skill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "colaborador_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "nota_actual" DECIMAL(5,2),
    "origen_actual" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_notas_skill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nota_skill_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DECIMAL(5,2),
    "origen" "origen_nota_skill_enum" NOT NULL,
    "referencia" JSONB,
    "autor_usuario_id" UUID,

    CONSTRAINT "historico_notas_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_curso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "colaborador_id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "rol" "rol_asignacion_enum" NOT NULL,
    "origen_voluntario" "origen_voluntario_enum",
    "estado_asignado" "estado_asignado_enum",
    "estado_voluntario" "estado_voluntario_enum",
    "fecha_inicio" TIMESTAMPTZ(6),
    "fecha_cierre" TIMESTAMPTZ(6),
    "observaciones_admin" TEXT,
    "resultado_entrevista_cliente" "resultado_entrevista_cliente_enum" DEFAULT 'PENDIENTE',
    "observaciones_cliente" TEXT,
    "fecha_entrevista_cliente" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_estados_asignacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asignacion_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_anterior" TEXT NOT NULL,
    "estado_nuevo" TEXT NOT NULL,
    "motivo" TEXT,
    "autor_usuario_id" UUID NOT NULL,

    CONSTRAINT "historico_estados_asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_estudio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asignacion_id" UUID NOT NULL,
    "fecha_calculo" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ficha_snapshot" JSONB,
    "esta_desactualizado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_estudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "modulo_id" UUID NOT NULL,
    "seccion_id" UUID NOT NULL,
    "caracter" "caracter_item_plan_enum" NOT NULL,
    "razon" "razon_item_plan_enum" NOT NULL,

    CONSTRAINT "items_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" "accion_ajuste_plan_enum" NOT NULL,
    "autor_usuario_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "seccion_id" UUID,

    CONSTRAINT "ajustes_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aperturas_seccion" (
    "asignacion_id" UUID NOT NULL,
    "seccion_id" UUID NOT NULL,
    "primera_apertura_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aperturas_seccion_pkey" PRIMARY KEY ("asignacion_id","seccion_id")
);

-- CreateTable
CREATE TABLE "intentos_bloque" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "colaborador_id" UUID NOT NULL,
    "bloque_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" DECIMAL(5,2) NOT NULL,
    "es_mejor_intento" BOOLEAN NOT NULL DEFAULT false,
    "respuestas" JSONB NOT NULL DEFAULT '{}',
    "version_bloque" INTEGER NOT NULL,
    "esta_invalidado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_bloque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos_transversales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curso_id" UUID NOT NULL,
    "descripcion" TEXT NOT NULL,
    "umbral_aprobacion" DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    "capas" JSONB NOT NULL DEFAULT '{}',
    "peso_capa_tests" DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    "peso_capa_cualitativa" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "peso_capa_comprension" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "capa_tests_activa" BOOLEAN NOT NULL DEFAULT true,
    "capa_cualitativa_activa" BOOLEAN NOT NULL DEFAULT true,
    "capa_comprension_activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proyectos_transversales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transversales_skills" (
    "transversal_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "transversales_skills_pkey" PRIMARY KEY ("transversal_id","skill_id")
);

-- CreateTable
CREATE TABLE "intentos_transversal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transversal_id" UUID NOT NULL,
    "colaborador_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" DECIMAL(5,2) NOT NULL,
    "aprobado" BOOLEAN NOT NULL,
    "repo_o_artefacto" JSONB NOT NULL DEFAULT '{}',
    "evaluaciones_capas" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "intentos_transversal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrevistas_ia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curso_id" UUID NOT NULL,
    "umbral_aprobacion" DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    "filosofia" "filosofia_entrevista_enum" NOT NULL DEFAULT 'PREPARACION',
    "profundidad" "profundidad_entrevista_enum" NOT NULL DEFAULT 'SEMI_SENIOR',
    "duracion_minutos" INTEGER NOT NULL DEFAULT 30,
    "tono" "tono_entrevista_enum" NOT NULL DEFAULT 'CONVERSACIONAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrevistas_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubrica_entrevista_ia" (
    "entrevista_ia_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "rubrica_entrevista_ia_pkey" PRIMARY KEY ("entrevista_ia_id","area_id")
);

-- CreateTable
CREATE TABLE "intentos_entrevista_ia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entrevista_ia_id" UUID NOT NULL,
    "colaborador_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota_global" DECIMAL(5,2) NOT NULL,
    "aprobado" BOOLEAN NOT NULL,
    "transcripcion_o_log" JSONB NOT NULL DEFAULT '{}',
    "rubrica_snapshot" JSONB NOT NULL DEFAULT '{}',
    "nota_ajustada_admin" DECIMAL(5,2),
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_ajuste_o_anulacion" TEXT,

    CONSTRAINT "intentos_entrevista_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intentos_entrevista_ia_notas_area" (
    "intento_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "nota" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "intentos_entrevista_ia_notas_area_pkey" PRIMARY KEY ("intento_id","area_id")
);

-- CreateTable
CREATE TABLE "intentos_entrevista_ia_secciones_base" (
    "intento_id" UUID NOT NULL,
    "seccion_id" UUID NOT NULL,

    CONSTRAINT "intentos_entrevista_ia_secciones_base_pkey" PRIMARY KEY ("intento_id","seccion_id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "tipo_evento" "tipo_evento_notif_enum" NOT NULL,
    "es_critico" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_leida" TIMESTAMPTZ(6),
    "archivada" BOOLEAN NOT NULL DEFAULT false,
    "error_correo" TEXT,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_canales" (
    "notificacion_id" UUID NOT NULL,
    "canal" "canal_notif_enum" NOT NULL,

    CONSTRAINT "notificaciones_canales_pkey" PRIMARY KEY ("notificacion_id","canal")
);

-- CreateTable
CREATE TABLE "preferencias_notificacion" (
    "usuario_id" UUID NOT NULL,
    "tipo_evento" "tipo_evento_notif_enum" NOT NULL,
    "silenciado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferencias_notificacion_pkey" PRIMARY KEY ("usuario_id","tipo_evento")
);

-- CreateTable
CREATE TABLE "aceptaciones_aviso_privacidad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "version_aviso" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aceptaciones_aviso_privacidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "autor_usuario_id" UUID NOT NULL,
    "tipo_log" TEXT NOT NULL,
    "filtros" JSONB,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_nombre_key" ON "areas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "skills_etiqueta_visible_key" ON "skills"("etiqueta_visible");

-- CreateIndex
CREATE INDEX "idx_skills_area_id" ON "skills"("area_id");

-- CreateIndex
CREATE INDEX "idx_historico_renombrados_skill_id" ON "historico_renombrados_skill"("skill_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "historico_cambios_area_skill_skill_id_fecha_idx" ON "historico_cambios_area_skill"("skill_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "historico_estados_modulo_modulo_id_fecha_idx" ON "historico_estados_modulo"("modulo_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_secciones_modulo" ON "secciones"("modulo_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "uq_secciones_modulo_orden" ON "secciones"("modulo_id", "orden");

-- CreateIndex
CREATE INDEX "idx_secciones_skills_skill" ON "secciones_skills"("skill_id");

-- CreateIndex
CREATE INDEX "idx_bloques_seccion" ON "bloques"("seccion_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "uq_bloques_seccion_orden" ON "bloques"("seccion_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nombre_key" ON "clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_transversal_id_key" ON "cursos"("transversal_id");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_entrevista_ia_id_key" ON "cursos"("entrevista_ia_id");

-- CreateIndex
CREATE INDEX "idx_cursos_cliente" ON "cursos"("cliente_id");

-- CreateIndex
CREATE INDEX "idx_cursos_estado" ON "cursos"("estado");

-- CreateIndex
CREATE INDEX "idx_cursos_deadline" ON "cursos"("fecha_deadline");

-- CreateIndex
CREATE INDEX "idx_cmh_modulo" ON "cursos_modulos_habilitados"("modulo_id");

-- CreateIndex
CREATE INDEX "idx_log_cambios_curso" ON "log_cambios_curso"("curso_id", "fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_email_key" ON "colaboradores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_colaborador_id_key" ON "usuarios"("colaborador_id");

-- CreateIndex
CREATE INDEX "idx_historico_passwords_usuario" ON "historico_passwords"("usuario_id", "fecha_cambio" DESC);

-- CreateIndex
CREATE INDEX "idx_sesiones_expire" ON "sesiones"("expire");

-- CreateIndex
CREATE INDEX "idx_notas_skill_skill" ON "notas_skill"("skill_id");

-- CreateIndex
CREATE INDEX "idx_notas_skill_colab" ON "notas_skill"("colaborador_id");

-- CreateIndex
CREATE UNIQUE INDEX "notas_skill_colaborador_id_skill_id_key" ON "notas_skill"("colaborador_id", "skill_id");

-- CreateIndex
CREATE INDEX "idx_historico_notas_skill_id" ON "historico_notas_skill"("nota_skill_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_asignaciones_curso" ON "asignaciones_curso"("curso_id");

-- CreateIndex
CREATE INDEX "idx_asignaciones_colab" ON "asignaciones_curso"("colaborador_id");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_curso_colaborador_id_curso_id_key" ON "asignaciones_curso"("colaborador_id", "curso_id");

-- CreateIndex
CREATE INDEX "historico_estados_asignacion_asignacion_id_fecha_idx" ON "historico_estados_asignacion"("asignacion_id", "fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "planes_estudio_asignacion_id_key" ON "planes_estudio"("asignacion_id");

-- CreateIndex
CREATE INDEX "idx_items_plan_plan" ON "items_plan"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_plan_plan_id_seccion_id_key" ON "items_plan"("plan_id", "seccion_id");

-- CreateIndex
CREATE INDEX "ajustes_plan_plan_id_fecha_idx" ON "ajustes_plan"("plan_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_aperturas_seccion_asignacion" ON "aperturas_seccion"("asignacion_id");

-- CreateIndex
CREATE INDEX "idx_intentos_bloque_colab_bloque" ON "intentos_bloque"("colaborador_id", "bloque_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_intentos_bloque_curso" ON "intentos_bloque"("curso_id", "colaborador_id");

-- CreateIndex
CREATE UNIQUE INDEX "proyectos_transversales_curso_id_key" ON "proyectos_transversales"("curso_id");

-- CreateIndex
CREATE INDEX "idx_intentos_trans_colab" ON "intentos_transversal"("transversal_id", "colaborador_id", "fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "entrevistas_ia_curso_id_key" ON "entrevistas_ia"("curso_id");

-- CreateIndex
CREATE INDEX "idx_intentos_eia_colab" ON "intentos_entrevista_ia"("entrevista_ia_id", "colaborador_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_notif_usuario_fecha" ON "notificaciones"("usuario_id", "fecha_creacion" DESC);

-- CreateIndex
CREATE INDEX "idx_aap_usuario" ON "aceptaciones_aviso_privacidad"("usuario_id", "fecha" DESC);

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_renombrados_skill" ADD CONSTRAINT "historico_renombrados_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_renombrados_skill" ADD CONSTRAINT "historico_renombrados_skill_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_cambios_area_skill" ADD CONSTRAINT "historico_cambios_area_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_cambios_area_skill" ADD CONSTRAINT "historico_cambios_area_skill_area_anterior_id_fkey" FOREIGN KEY ("area_anterior_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_cambios_area_skill" ADD CONSTRAINT "historico_cambios_area_skill_area_nueva_id_fkey" FOREIGN KEY ("area_nueva_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_cambios_area_skill" ADD CONSTRAINT "historico_cambios_area_skill_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estados_modulo" ADD CONSTRAINT "historico_estados_modulo_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estados_modulo" ADD CONSTRAINT "historico_estados_modulo_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones" ADD CONSTRAINT "secciones_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones_skills" ADD CONSTRAINT "secciones_skills_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones_skills" ADD CONSTRAINT "secciones_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloques" ADD CONSTRAINT "bloques_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloques" ADD CONSTRAINT "bloques_skill_que_mide_id_fkey" FOREIGN KEY ("skill_que_mide_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_transversal_id_fkey" FOREIGN KEY ("transversal_id") REFERENCES "proyectos_transversales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_entrevista_ia_id_fkey" FOREIGN KEY ("entrevista_ia_id") REFERENCES "entrevistas_ia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos_areas_exigidas" ADD CONSTRAINT "cursos_areas_exigidas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos_areas_exigidas" ADD CONSTRAINT "cursos_areas_exigidas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos_skills_exigidas" ADD CONSTRAINT "cursos_skills_exigidas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos_skills_exigidas" ADD CONSTRAINT "cursos_skills_exigidas_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos_modulos_habilitados" ADD CONSTRAINT "cursos_modulos_habilitados_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos_modulos_habilitados" ADD CONSTRAINT "cursos_modulos_habilitados_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_cambios_curso" ADD CONSTRAINT "log_cambios_curso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_cambios_curso" ADD CONSTRAINT "log_cambios_curso_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_passwords" ADD CONSTRAINT "historico_passwords_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_skill" ADD CONSTRAINT "notas_skill_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_skill" ADD CONSTRAINT "notas_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_notas_skill" ADD CONSTRAINT "historico_notas_skill_nota_skill_id_fkey" FOREIGN KEY ("nota_skill_id") REFERENCES "notas_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_notas_skill" ADD CONSTRAINT "historico_notas_skill_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_curso" ADD CONSTRAINT "asignaciones_curso_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_curso" ADD CONSTRAINT "asignaciones_curso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estados_asignacion" ADD CONSTRAINT "historico_estados_asignacion_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignaciones_curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estados_asignacion" ADD CONSTRAINT "historico_estados_asignacion_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_estudio" ADD CONSTRAINT "planes_estudio_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignaciones_curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_plan" ADD CONSTRAINT "items_plan_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_plan" ADD CONSTRAINT "items_plan_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_plan" ADD CONSTRAINT "items_plan_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_plan" ADD CONSTRAINT "ajustes_plan_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_estudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_plan" ADD CONSTRAINT "ajustes_plan_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_plan" ADD CONSTRAINT "ajustes_plan_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aperturas_seccion" ADD CONSTRAINT "aperturas_seccion_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignaciones_curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aperturas_seccion" ADD CONSTRAINT "aperturas_seccion_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_bloque" ADD CONSTRAINT "intentos_bloque_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_bloque" ADD CONSTRAINT "intentos_bloque_bloque_id_fkey" FOREIGN KEY ("bloque_id") REFERENCES "bloques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_bloque" ADD CONSTRAINT "intentos_bloque_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_bloque" ADD CONSTRAINT "intentos_bloque_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transversales_skills" ADD CONSTRAINT "transversales_skills_transversal_id_fkey" FOREIGN KEY ("transversal_id") REFERENCES "proyectos_transversales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transversales_skills" ADD CONSTRAINT "transversales_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_transversal" ADD CONSTRAINT "intentos_transversal_transversal_id_fkey" FOREIGN KEY ("transversal_id") REFERENCES "proyectos_transversales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_transversal" ADD CONSTRAINT "intentos_transversal_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubrica_entrevista_ia" ADD CONSTRAINT "rubrica_entrevista_ia_entrevista_ia_id_fkey" FOREIGN KEY ("entrevista_ia_id") REFERENCES "entrevistas_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubrica_entrevista_ia" ADD CONSTRAINT "rubrica_entrevista_ia_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_entrevista_ia" ADD CONSTRAINT "intentos_entrevista_ia_entrevista_ia_id_fkey" FOREIGN KEY ("entrevista_ia_id") REFERENCES "entrevistas_ia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_entrevista_ia" ADD CONSTRAINT "intentos_entrevista_ia_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_entrevista_ia_notas_area" ADD CONSTRAINT "intentos_entrevista_ia_notas_area_intento_id_fkey" FOREIGN KEY ("intento_id") REFERENCES "intentos_entrevista_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_entrevista_ia_notas_area" ADD CONSTRAINT "intentos_entrevista_ia_notas_area_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_entrevista_ia_secciones_base" ADD CONSTRAINT "intentos_entrevista_ia_secciones_base_intento_id_fkey" FOREIGN KEY ("intento_id") REFERENCES "intentos_entrevista_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_entrevista_ia_secciones_base" ADD CONSTRAINT "intentos_entrevista_ia_secciones_base_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_canales" ADD CONSTRAINT "notificaciones_canales_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferencias_notificacion" ADD CONSTRAINT "preferencias_notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aceptaciones_aviso_privacidad" ADD CONSTRAINT "aceptaciones_aviso_privacidad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_logs" ADD CONSTRAINT "consultas_logs_autor_usuario_id_fkey" FOREIGN KEY ("autor_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
