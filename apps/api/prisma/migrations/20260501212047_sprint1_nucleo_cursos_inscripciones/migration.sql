-- Sprint 1: Núcleo de cursos, módulos, secciones, contenidos,
-- convocatorias, inscripciones, asignaciones, progreso y entregas.
--
-- La tabla "usuarios" ya existe desde la migración anterior con columnas
-- en camelCase. Se usa RENAME COLUMN para preservar los datos existentes
-- en lugar de DROP + ADD que requeriría valores por defecto o datos vacíos.

-- ═══════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE "RolUsuario" AS ENUM ('PARTICIPANTE', 'ADMIN', 'VIEWER', 'SUPER_ADMIN');
CREATE TYPE "NivelCurso" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO');
CREATE TYPE "EstadoCurso" AS ENUM ('BORRADOR', 'PUBLICADO', 'DESHABILITADO');
CREATE TYPE "EstadoModulo" AS ENUM ('BORRADOR', 'PUBLICADO');
CREATE TYPE "TipoContenido" AS ENUM ('LECTURA', 'EJEMPLO_CODIGO', 'EJERCICIO', 'TEST', 'VIDEO', 'RECURSO');
CREATE TYPE "EstadoConvocatoria" AS ENUM ('ABIERTA', 'EN_CURSO', 'CERRADA', 'CANCELADA');
CREATE TYPE "TipoInscripcion" AS ENUM ('ASIGNADA', 'VOLUNTARIA');
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVA', 'COMPLETADA', 'PAUSADA', 'ABANDONADA');
CREATE TYPE "PrioridadModulo" AS ENUM ('OBLIGATORIO', 'RECOMENDADO', 'OPCIONAL');
CREATE TYPE "OrigenAsignacion" AS ENUM ('ASIGNADA', 'VOLUNTARIA');
CREATE TYPE "EstadoProgreso" AS ENUM ('NO_INICIADO', 'EN_PROGRESO', 'COMPLETADO');
CREATE TYPE "EtiquetaLogro" AS ENUM ('EXCELENCIA', 'APROBADO', 'EN_DESARROLLO', 'INSUFICIENTE');
CREATE TYPE "EstadoEntrega" AS ENUM ('PENDIENTE', 'REVISANDO', 'APROBADA', 'RECHAZADA', 'REQUIERE_REVISION');

-- ═══════════════════════════════════════════════════════════════
-- USUARIOS — migrar columnas existentes a snake_case con RENAME
-- ═══════════════════════════════════════════════════════════════

-- Renombrar columnas existentes (preserva datos)
ALTER TABLE "usuarios" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "usuarios" RENAME COLUMN "mfaEnabled" TO "mfa_enabled";
ALTER TABLE "usuarios" RENAME COLUMN "mfaSecret" TO "mfa_secret";
ALTER TABLE "usuarios" RENAME COLUMN "debeCambiarPassword" TO "debe_cambiar_password";
ALTER TABLE "usuarios" RENAME COLUMN "passwordCambiadoEn" TO "password_cambiado_en";
ALTER TABLE "usuarios" RENAME COLUMN "ultimoLoginEn" TO "ultimo_login_en";
ALTER TABLE "usuarios" RENAME COLUMN "intentosFallidos" TO "intentos_fallidos";
ALTER TABLE "usuarios" RENAME COLUMN "bloqueadoHasta" TO "bloqueado_hasta";
ALTER TABLE "usuarios" RENAME COLUMN "creadoEn" TO "creado_en";
ALTER TABLE "usuarios" RENAME COLUMN "actualizadoEn" TO "actualizado_en";

-- Migrar columna "rol" de TEXT a enum RolUsuario
-- Se elimina el default primero para poder hacer el cast, luego se restaura
ALTER TABLE "usuarios" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "usuarios"
  ALTER COLUMN "rol" TYPE "RolUsuario" USING "rol"::"RolUsuario";
ALTER TABLE "usuarios"
  ALTER COLUMN "rol" SET DEFAULT 'PARTICIPANTE'::"RolUsuario";

-- Ajustar default de debe_cambiar_password a true (nuevo usuario siempre debe cambiar)
ALTER TABLE "usuarios" ALTER COLUMN "debe_cambiar_password" SET DEFAULT true;

-- ═══════════════════════════════════════════════════════════════
-- ÁREAS DE COMPETENCIA
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "areas_competencia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "orden" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_competencia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "areas_competencia_nombre_key" ON "areas_competencia"("nombre");

-- ═══════════════════════════════════════════════════════════════
-- CURSOS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "nivel" "NivelCurso" NOT NULL DEFAULT 'BASICO',
    "estado" "EstadoCurso" NOT NULL DEFAULT 'BORRADOR',
    "umbral_excelencia" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "umbral_aprobado" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "umbral_en_desarrollo" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "umbral_diagnostico_obligatorio" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "umbral_diagnostico_recomendado" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cursos_slug_key" ON "cursos"("slug");

-- ═══════════════════════════════════════════════════════════════
-- PESOS POR TIPO DE ACTIVIDAD
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "curso_tipo_pesos" (
    "curso_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "nivel" TEXT NOT NULL DEFAULT 'modulo',

    CONSTRAINT "curso_tipo_pesos_pkey" PRIMARY KEY ("curso_id","tipo")
);

ALTER TABLE "curso_tipo_pesos"
  ADD CONSTRAINT "curso_tipo_pesos_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- MÓDULOS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "modulos" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "duracion_estimada" INTEGER,
    "estado" "EstadoModulo" NOT NULL DEFAULT 'BORRADOR',
    "puntaje_objetivo" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "area_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "modulos_curso_id_orden_idx" ON "modulos"("curso_id", "orden");
CREATE INDEX "modulos_area_id_idx" ON "modulos"("area_id");
CREATE UNIQUE INDEX "modulos_curso_id_slug_key" ON "modulos"("curso_id", "slug");
CREATE UNIQUE INDEX "modulos_curso_id_orden_key" ON "modulos"("curso_id", "orden");

ALTER TABLE "modulos"
  ADD CONSTRAINT "modulos_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "modulos"
  ADD CONSTRAINT "modulos_area_id_fkey"
  FOREIGN KEY ("area_id") REFERENCES "areas_competencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- TRAZABILIDAD DE CLONADO
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "modulos_origen" (
    "modulo_id" TEXT NOT NULL,
    "modulo_origen_id" TEXT,
    "curso_origen_id" TEXT,
    "clonado_por" TEXT,
    "clonado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modulos_origen_pkey" PRIMARY KEY ("modulo_id")
);

ALTER TABLE "modulos_origen"
  ADD CONSTRAINT "modulos_origen_modulo_id_fkey"
  FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "modulos_origen"
  ADD CONSTRAINT "modulos_origen_modulo_origen_id_fkey"
  FOREIGN KEY ("modulo_origen_id") REFERENCES "modulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- SECCIONES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "secciones" (
    "id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "secciones_modulo_id_orden_key" ON "secciones"("modulo_id", "orden");

ALTER TABLE "secciones"
  ADD CONSTRAINT "secciones_modulo_id_fkey"
  FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- CONTENIDOS DINÁMICOS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "contenidos_dinamicos" (
    "id" TEXT NOT NULL,
    "seccion_id" TEXT NOT NULL,
    "tipo" "TipoContenido" NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "contenido" JSONB NOT NULL,
    "metadata" JSONB,
    "archivado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contenidos_dinamicos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contenidos_dinamicos_seccion_id_orden_idx" ON "contenidos_dinamicos"("seccion_id", "orden");
CREATE UNIQUE INDEX "contenidos_dinamicos_seccion_id_orden_key" ON "contenidos_dinamicos"("seccion_id", "orden");
-- Índice parcial para contenidos activos (no soportado en @@index de Prisma 6.1)
CREATE INDEX "idx_contenidos_activos" ON "contenidos_dinamicos"("seccion_id", "orden") WHERE archivado = false;

ALTER TABLE "contenidos_dinamicos"
  ADD CONSTRAINT "contenidos_dinamicos_seccion_id_fkey"
  FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- CONVOCATORIAS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "convocatorias" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresa_cliente" TEXT,
    "descripcion" TEXT,
    "estado" "EstadoConvocatoria" NOT NULL DEFAULT 'ABIERTA',
    "fecha_inicio" TIMESTAMP(3),
    "fecha_limite" TIMESTAMP(3),
    "creado_por_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convocatorias_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "convocatorias_curso_id_estado_idx" ON "convocatorias"("curso_id", "estado");

ALTER TABLE "convocatorias"
  ADD CONSTRAINT "convocatorias_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "convocatorias"
  ADD CONSTRAINT "convocatorias_creado_por_id_fkey"
  FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- INSCRIPCIONES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "inscripciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "convocatoria_id" TEXT,
    "tipo" "TipoInscripcion" NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVA',
    "inscrito_por_id" TEXT,
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_completado" TIMESTAMP(3),
    "fecha_limite" TIMESTAMP(3),

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inscripciones_usuario_id_idx" ON "inscripciones"("usuario_id");
CREATE INDEX "inscripciones_curso_id_idx" ON "inscripciones"("curso_id");
CREATE INDEX "inscripciones_convocatoria_id_idx" ON "inscripciones"("convocatoria_id");
CREATE INDEX "inscripciones_fecha_limite_idx" ON "inscripciones"("fecha_limite");
-- Índices parciales (no soportados en Prisma 6.1 @@index)
CREATE INDEX "idx_inscripciones_convocatoria" ON "inscripciones"("convocatoria_id") WHERE convocatoria_id IS NOT NULL;
CREATE INDEX "idx_inscripciones_deadline" ON "inscripciones"("fecha_limite") WHERE fecha_limite IS NOT NULL;
CREATE UNIQUE INDEX "inscripciones_usuario_id_curso_id_convocatoria_id_key" ON "inscripciones"("usuario_id", "curso_id", "convocatoria_id");

ALTER TABLE "inscripciones"
  ADD CONSTRAINT "inscripciones_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inscripciones"
  ADD CONSTRAINT "inscripciones_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inscripciones"
  ADD CONSTRAINT "inscripciones_convocatoria_id_fkey"
  FOREIGN KEY ("convocatoria_id") REFERENCES "convocatorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inscripciones"
  ADD CONSTRAINT "inscripciones_inscrito_por_id_fkey"
  FOREIGN KEY ("inscrito_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- DIAGNÓSTICOS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "diagnosticos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "titulo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "diagnosticos"
  ADD CONSTRAINT "diagnosticos_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "diagnosticos"
  ADD CONSTRAINT "diagnosticos_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "resultados_diagnostico" (
    "id" TEXT NOT NULL,
    "diagnostico_id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "puntaje" DOUBLE PRECISION NOT NULL,
    "brecha" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL,
    "observaciones" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultados_diagnostico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resultados_diagnostico_diagnostico_id_modulo_id_key"
  ON "resultados_diagnostico"("diagnostico_id", "modulo_id");

ALTER TABLE "resultados_diagnostico"
  ADD CONSTRAINT "resultados_diagnostico_diagnostico_id_fkey"
  FOREIGN KEY ("diagnostico_id") REFERENCES "diagnosticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resultados_diagnostico"
  ADD CONSTRAINT "resultados_diagnostico_modulo_id_fkey"
  FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- ASIGNACIONES DE MÓDULO
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "asignaciones_modulo" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "prioridad" "PrioridadModulo" NOT NULL DEFAULT 'OPCIONAL',
    "origen" "OrigenAsignacion" NOT NULL DEFAULT 'VOLUNTARIA',
    "diagnostico_id" TEXT,
    "fecha_limite" TIMESTAMP(3),

    CONSTRAINT "asignaciones_modulo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asignaciones_modulo_fecha_limite_idx" ON "asignaciones_modulo"("fecha_limite");
CREATE INDEX "idx_asignaciones_deadline" ON "asignaciones_modulo"("fecha_limite") WHERE fecha_limite IS NOT NULL;
CREATE UNIQUE INDEX "asignaciones_modulo_inscripcion_id_modulo_id_key"
  ON "asignaciones_modulo"("inscripcion_id", "modulo_id");

ALTER TABLE "asignaciones_modulo"
  ADD CONSTRAINT "asignaciones_modulo_inscripcion_id_fkey"
  FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asignaciones_modulo"
  ADD CONSTRAINT "asignaciones_modulo_modulo_id_fkey"
  FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "asignaciones_modulo"
  ADD CONSTRAINT "asignaciones_modulo_diagnostico_id_fkey"
  FOREIGN KEY ("diagnostico_id") REFERENCES "diagnosticos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- PROGRESO
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "progresos_curso" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "estado" "EstadoProgreso" NOT NULL DEFAULT 'NO_INICIADO',
    "porcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nota_final" DOUBLE PRECISION,
    "etiqueta_logro" "EtiquetaLogro",
    "modulos_completados" INTEGER NOT NULL DEFAULT 0,
    "modulos_totales" INTEGER NOT NULL DEFAULT 0,
    "tiempo_total" INTEGER NOT NULL DEFAULT 0,
    "iniciado_en" TIMESTAMP(3),
    "completado_en" TIMESTAMP(3),
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progresos_curso_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "progresos_curso_inscripcion_id_key" ON "progresos_curso"("inscripcion_id");
CREATE INDEX "progresos_curso_usuario_id_idx" ON "progresos_curso"("usuario_id");
CREATE INDEX "progresos_curso_curso_id_idx" ON "progresos_curso"("curso_id");

ALTER TABLE "progresos_curso"
  ADD CONSTRAINT "progresos_curso_inscripcion_id_fkey"
  FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "progresos_curso"
  ADD CONSTRAINT "progresos_curso_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progresos_curso"
  ADD CONSTRAINT "progresos_curso_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "progresos_modulo" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "estado" "EstadoProgreso" NOT NULL DEFAULT 'NO_INICIADO',
    "porcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "puntaje" DOUBLE PRECISION,
    "tiempo_total" INTEGER NOT NULL DEFAULT 0,
    "iniciado_en" TIMESTAMP(3),
    "completado_en" TIMESTAMP(3),
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progresos_modulo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "progresos_modulo_inscripcion_id_modulo_id_key"
  ON "progresos_modulo"("inscripcion_id", "modulo_id");
CREATE INDEX "progresos_modulo_usuario_id_idx" ON "progresos_modulo"("usuario_id");
CREATE INDEX "progresos_modulo_inscripcion_id_idx" ON "progresos_modulo"("inscripcion_id");

ALTER TABLE "progresos_modulo"
  ADD CONSTRAINT "progresos_modulo_inscripcion_id_fkey"
  FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progresos_modulo"
  ADD CONSTRAINT "progresos_modulo_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progresos_modulo"
  ADD CONSTRAINT "progresos_modulo_modulo_id_fkey"
  FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "progresos_contenido" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "contenido_id" TEXT NOT NULL,
    "visto_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progresos_contenido_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "progresos_contenido_inscripcion_id_contenido_id_key"
  ON "progresos_contenido"("inscripcion_id", "contenido_id");
CREATE INDEX "progresos_contenido_inscripcion_id_idx" ON "progresos_contenido"("inscripcion_id");

ALTER TABLE "progresos_contenido"
  ADD CONSTRAINT "progresos_contenido_inscripcion_id_fkey"
  FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progresos_contenido"
  ADD CONSTRAINT "progresos_contenido_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progresos_contenido"
  ADD CONSTRAINT "progresos_contenido_contenido_id_fkey"
  FOREIGN KEY ("contenido_id") REFERENCES "contenidos_dinamicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- ENTREGAS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE "entregas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "contenido_id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "estado" "EstadoEntrega" NOT NULL DEFAULT 'PENDIENTE',
    "puntaje" DOUBLE PRECISION,
    "retroalimentacion" TEXT,
    "score_ia" DOUBLE PRECISION,
    "flags_ia" JSONB,
    "stdout" TEXT,
    "stderr" TEXT,
    "tests_pasados" INTEGER,
    "tests_total" INTEGER,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluado_en" TIMESTAMP(3),

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "entregas_usuario_id_idx" ON "entregas"("usuario_id");
CREATE INDEX "entregas_contenido_id_idx" ON "entregas"("contenido_id");
CREATE INDEX "entregas_estado_idx" ON "entregas"("estado");
CREATE INDEX "entregas_inscripcion_id_idx" ON "entregas"("inscripcion_id");

ALTER TABLE "entregas"
  ADD CONSTRAINT "entregas_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "entregas"
  ADD CONSTRAINT "entregas_contenido_id_fkey"
  FOREIGN KEY ("contenido_id") REFERENCES "contenidos_dinamicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "entregas"
  ADD CONSTRAINT "entregas_inscripcion_id_fkey"
  FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "entrega_drafts" (
    "usuario_id" TEXT NOT NULL,
    "contenido_id" TEXT NOT NULL,
    "archivos" JSONB NOT NULL,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entrega_drafts_pkey" PRIMARY KEY ("usuario_id","contenido_id")
);

ALTER TABLE "entrega_drafts"
  ADD CONSTRAINT "entrega_drafts_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "entrega_drafts"
  ADD CONSTRAINT "entrega_drafts_contenido_id_fkey"
  FOREIGN KEY ("contenido_id") REFERENCES "contenidos_dinamicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "archivos_entrega" (
    "id" TEXT NOT NULL,
    "entrega_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_only" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "archivos_entrega_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "archivos_entrega"
  ADD CONSTRAINT "archivos_entrega_entrega_id_fkey"
  FOREIGN KEY ("entrega_id") REFERENCES "entregas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
