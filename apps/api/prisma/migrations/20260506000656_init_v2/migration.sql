-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'PARTICIPANTE', 'VIEWER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "EstadoCurso" AS ENUM ('BORRADOR', 'ACTIVO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVA', 'COMPLETADA', 'ABANDONADA', 'CERRADO_SIN_COMPLETAR');

-- CreateEnum
CREATE TYPE "TipoInscripcion" AS ENUM ('SOLICITUD', 'LIBRE');

-- CreateEnum
CREATE TYPE "TipoAsignacion" AS ENUM ('OBLIGATORIO', 'RECOMENDADO', 'OPCIONAL');

-- CreateEnum
CREATE TYPE "EstadoModuloParticipante" AS ENUM ('NO_INICIADO', 'EN_PROGRESO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "TipoBloque" AS ENUM ('PARRAFO', 'TIP', 'VIDEO', 'RECURSO', 'CODIGO', 'QUIZ');

-- CreateEnum
CREATE TYPE "CodigoUbicacion" AS ENUM ('INLINE', 'SEPARADO');

-- CreateEnum
CREATE TYPE "CodigoInteractivo" AS ENUM ('SOLO_VER', 'EDITABLE');

-- CreateEnum
CREATE TYPE "CodigoEvaluable" AS ENUM ('NINGUNO', 'PREGUNTAS', 'TESTS');

-- CreateEnum
CREATE TYPE "LenguajeCodigo" AS ENUM ('PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'REACT');

-- CreateEnum
CREATE TYPE "ModoEntrevista" AS ENUM ('TEXTO', 'VOZ');

-- CreateEnum
CREATE TYPE "EstadoArea" AS ENUM ('ACTIVA', 'OBSOLETA');

-- CreateEnum
CREATE TYPE "EstadoArchivado" AS ENUM ('ARCHIVADO');

-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('ENVIADA', 'EVALUADA_AUTOMATICAMENTE', 'PENDIENTE_REVISION', 'EVALUADA');

-- CreateEnum
CREATE TYPE "EstadoEntregaProyecto" AS ENUM ('ENVIADA', 'EN_REVISION', 'EVALUADA');

-- CreateEnum
CREATE TYPE "CapaEvaluacion" AS ENUM ('CAPA_1_OBJETIVA', 'CAPA_2_CUALITATIVA_IA', 'CAPA_3_COMPRENSION_IA');

-- CreateEnum
CREATE TYPE "ConfianzaEntrevistaIA" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoEntrevistaIA" AS ENUM ('PENDIENTE', 'EN_CURSO', 'APROBADA', 'NO_APROBADA', 'AJUSTADA_MANUAL');

-- CreateEnum
CREATE TYPE "EtiquetaLogro" AS ENUM ('EXCELENCIA', 'APROBADO', 'EN_DESARROLLO', 'INSUFICIENTE');

-- CreateEnum
CREATE TYPE "TipoActor" AS ENUM ('USUARIO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "TipoAccionLog" AS ENUM ('CURSO_PUBLICADO', 'CURSO_DESPUBLICADO', 'CURSO_CERRADO', 'CURSO_ELIMINADO', 'PESOS_CAMBIADOS_RETROACTIVO', 'BLOQUE_ARCHIVADO', 'BLOQUE_RESTAURADO', 'SECCION_ARCHIVADA', 'SECCION_RESTAURADA', 'MODULO_ARCHIVADO', 'MODULO_RESTAURADO', 'MODULOS_ASIGNADOS', 'INSCRIPCION_DESINSCRITA', 'INSCRIPCION_COMPLETADA', 'INSCRIPCION_CERRADA_SIN_COMPLETAR', 'EXPEDIENTE_SELLADO', 'NOTA_AJUSTADA_MANUAL', 'PROYECTO_EVALUADO', 'ENTREGA_EVALUADA', 'EXPEDIENTE_AJUSTADO', 'RECALCULO_MODULO', 'RECALCULO_AREA', 'RECALCULO_CURSO', 'RECALCULO_ETIQUETA', 'AREA_CREADA', 'AREA_ACTUALIZADA', 'AREA_OBSOLETADA', 'AREA_ELIMINADA', 'USUARIO_CREADO', 'USUARIO_ACTUALIZADO', 'USUARIO_BLOQUEADO', 'USUARIO_DESBLOQUEADO', 'PASSWORD_RESETEADA', 'MFA_ACTIVADO', 'MFA_DESACTIVADO', 'MFA_RESETEADO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('MODULO_ASIGNADO', 'ENTREGA_EVALUADA', 'PROYECTO_REVISADO', 'DESBLOQUEO', 'RECALCULO_NOTA', 'CURSO_COMPLETADO', 'NUEVA_ENTREGA', 'NUEVO_PROYECTO', 'ALERTA_PLAGIO', 'CANDIDATO_LISTO');

-- CreateEnum
CREATE TYPE "NivelBrecha" AS ENUM ('NO_CUMPLE', 'CERCA', 'CUMPLE');

-- CreateEnum
CREATE TYPE "AuthEventoTipo" AS ENUM ('LOGIN_OK', 'LOGIN_FALLIDO', 'LOGIN_BLOQUEADO', 'MFA_SETUP_INICIADO', 'MFA_ACTIVADO', 'MFA_VERIFICADO', 'MFA_FALLIDO', 'PASSWORD_CAMBIADO', 'LOGOUT');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
    "rol" "Rol" NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "mfaActivado" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "bloqueadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mfaConfirmadoEn" TIMESTAMP(3),
    "passwordCambiadoEn" TIMESTAMP(3),
    "ultimoLoginEn" TIMESTAMP(3),
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoArea" NOT NULL DEFAULT 'ACTIVA',
    "obsoletaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" UUID NOT NULL,
    "empresaCliente" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagenUrl" TEXT,
    "duracionEstimada" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "estado" "EstadoCurso" NOT NULL DEFAULT 'BORRADOR',
    "permiteInscripcionLibre" BOOLEAN NOT NULL DEFAULT false,
    "pesoAreas" DECIMAL(5,2) NOT NULL DEFAULT 70.0,
    "pesoProyectoTransversal" DECIMAL(5,2) NOT NULL DEFAULT 20.0,
    "pesoEntrevistaIA" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "pesoActividades" DECIMAL(5,2) NOT NULL DEFAULT 70.0,
    "pesoMiniProyecto" DECIMAL(5,2) NOT NULL DEFAULT 30.0,
    "umbralExcelencia" INTEGER NOT NULL DEFAULT 90,
    "umbralAprobado" INTEGER NOT NULL DEFAULT 70,
    "umbralEnDesarrollo" INTEGER NOT NULL DEFAULT 50,
    "umbralBrechaNoCumple" INTEGER NOT NULL DEFAULT 10,
    "publicadoAt" TIMESTAMP(3),
    "cerradoAt" TIMESTAMP(3),
    "duplicadoDeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoArea" (
    "id" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,
    "puntajeObjetivo" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CursoArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "miniProyectoActivo" BOOLEAN NOT NULL DEFAULT false,
    "umbralMiniOverride" INTEGER,
    "clonadoDeId" UUID,
    "archivadoAt" TIMESTAMP(3),
    "archivadoEstado" "EstadoArchivado",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seccion" (
    "id" UUID NOT NULL,
    "moduloId" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "archivadoAt" TIMESTAMP(3),
    "archivadoEstado" "EstadoArchivado",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bloque" (
    "id" UUID NOT NULL,
    "seccionId" UUID NOT NULL,
    "tipo" "TipoBloque" NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "codigoUbicacion" "CodigoUbicacion",
    "codigoInteractivo" "CodigoInteractivo",
    "codigoEvaluable" "CodigoEvaluable",
    "codigoLenguaje" "LenguajeCodigo",
    "payload" JSONB NOT NULL,
    "solucionReferencia" TEXT,
    "archivadoAt" TIMESTAMP(3),
    "archivadoEstado" "EstadoArchivado",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bloque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniProyecto" (
    "id" UUID NOT NULL,
    "moduloId" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "pesoCapa1" DECIMAL(5,2) NOT NULL DEFAULT 40.0,
    "pesoCapa2" DECIMAL(5,2) NOT NULL DEFAULT 30.0,
    "pesoCapa3" DECIMAL(5,2) NOT NULL DEFAULT 30.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiniProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoTransversal" (
    "id" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "umbralAprobacion" INTEGER NOT NULL DEFAULT 70,
    "pesoCapa1" DECIMAL(5,2) NOT NULL DEFAULT 40.0,
    "pesoCapa2" DECIMAL(5,2) NOT NULL DEFAULT 30.0,
    "pesoCapa3" DECIMAL(5,2) NOT NULL DEFAULT 30.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProyectoTransversal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrevistaIAConfig" (
    "id" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "perfilCliente" TEXT NOT NULL,
    "contextoNegocio" TEXT NOT NULL,
    "umbralAprobacion" INTEGER NOT NULL DEFAULT 70,
    "numeroPreguntas" INTEGER NOT NULL DEFAULT 8,
    "modo" "ModoEntrevista" NOT NULL DEFAULT 'TEXTO',
    "maxIntentos" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrevistaIAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricaEntrevistaItem" (
    "id" UUID NOT NULL,
    "configId" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "RubricaEntrevistaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" UUID NOT NULL,
    "participanteId" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "tipo" "TipoInscripcion" NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVA',
    "inscritaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completadaAt" TIMESTAMP(3),
    "abandonadaAt" TIMESTAMP(3),
    "cerradaSinCompletarAt" TIMESTAMP(3),

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignacion" (
    "id" UUID NOT NULL,
    "inscripcionId" UUID NOT NULL,
    "moduloId" UUID NOT NULL,
    "tipo" "TipoAsignacion" NOT NULL,
    "asignadaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadaAt" TIMESTAMP(3),

    CONSTRAINT "Asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadoModuloInscripcion" (
    "id" UUID NOT NULL,
    "inscripcionId" UUID NOT NULL,
    "moduloId" UUID NOT NULL,
    "estado" "EstadoModuloParticipante" NOT NULL DEFAULT 'NO_INICIADO',
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "iniciadoAt" TIMESTAMP(3),
    "completadoAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstadoModuloInscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionInicial" (
    "id" UUID NOT NULL,
    "inscripcionId" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "observaciones" TEXT,
    "capturadaPorId" UUID NOT NULL,
    "capturadaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluacionInicial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaBloque" (
    "id" UUID NOT NULL,
    "inscripcionId" UUID NOT NULL,
    "bloqueId" UUID NOT NULL,
    "intento" INTEGER NOT NULL,
    "contenido" JSONB NOT NULL,
    "nota" DECIMAL(5,2),
    "feedback" TEXT,
    "estado" "EstadoEntrega" NOT NULL DEFAULT 'ENVIADA',
    "ajustadaManual" BOOLEAN NOT NULL DEFAULT false,
    "evaluadaPorId" UUID,
    "enviadaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluadaAt" TIMESTAMP(3),

    CONSTRAINT "EntregaBloque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaProyecto" (
    "id" UUID NOT NULL,
    "inscripcionId" UUID NOT NULL,
    "miniProyectoId" UUID,
    "transversalId" UUID,
    "intento" INTEGER NOT NULL,
    "urlRepo" TEXT NOT NULL,
    "rama" TEXT NOT NULL,
    "pesoCapa1Aplicado" DECIMAL(5,2),
    "pesoCapa2Aplicado" DECIMAL(5,2),
    "pesoCapa3Aplicado" DECIMAL(5,2),
    "notaCapa1" DECIMAL(5,2),
    "notaCapa2" DECIMAL(5,2),
    "notaCapa3" DECIMAL(5,2),
    "notaFinal" DECIMAL(5,2),
    "ajustadaManual" BOOLEAN NOT NULL DEFAULT false,
    "fortalezas" TEXT,
    "areasMejora" TEXT,
    "dudasDetectadas" TEXT,
    "transcripcionCapa3" TEXT,
    "estado" "EstadoEntregaProyecto" NOT NULL DEFAULT 'ENVIADA',
    "enviadaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluadaAt" TIMESTAMP(3),

    CONSTRAINT "EntregaProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCapaEvaluacion" (
    "id" UUID NOT NULL,
    "entregaProyectoId" UUID NOT NULL,
    "capa" "CapaEvaluacion" NOT NULL,
    "detalle" JSONB NOT NULL,
    "generadaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetalleCapaEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaIA" (
    "id" UUID NOT NULL,
    "entregaProyectoId" UUID,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "detectadaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaAt" TIMESTAMP(3),
    "resueltaPorId" UUID,

    CONSTRAINT "AlertaIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrevistaIASesion" (
    "id" UUID NOT NULL,
    "inscripcionId" UUID NOT NULL,
    "configId" UUID NOT NULL,
    "intento" INTEGER NOT NULL,
    "estado" "EstadoEntrevistaIA" NOT NULL DEFAULT 'PENDIENTE',
    "scoreGeneral" DECIMAL(5,2),
    "confianza" "ConfianzaEntrevistaIA",
    "desglosePorArea" JSONB,
    "fortalezas" TEXT,
    "areasMejora" TEXT,
    "ajustadaManual" BOOLEAN NOT NULL DEFAULT false,
    "iniciadaAt" TIMESTAMP(3),
    "finalizadaAt" TIMESTAMP(3),

    CONSTRAINT "EntrevistaIASesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpedienteEntry" (
    "id" UUID NOT NULL,
    "participanteId" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "tituloCurso" TEXT NOT NULL,
    "empresaCliente" TEXT NOT NULL,
    "fechaCompletitud" TIMESTAMP(3) NOT NULL,
    "notaGlobal" DECIMAL(5,2) NOT NULL,
    "etiqueta" "EtiquetaLogro" NOT NULL,
    "ajustadoManual" BOOLEAN NOT NULL DEFAULT false,
    "selladoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpedienteEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpedienteEntryArea" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "nombreAreaSnapshot" TEXT NOT NULL,
    "puntaje" DECIMAL(5,2) NOT NULL,
    "cumpleUmbral" BOOLEAN NOT NULL,

    CONSTRAINT "ExpedienteEntryArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogActividad" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "tipoActor" "TipoActor" NOT NULL DEFAULT 'USUARIO',
    "tipoAccion" "TipoAccionLog" NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" UUID NOT NULL,
    "valorAntes" JSONB,
    "valorDespues" JSONB,
    "motivo" TEXT,
    "causaId" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogActividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" UUID NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "destinatarioId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "leidaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthEvento" (
    "id" UUID NOT NULL,
    "usuarioId" UUID,
    "email" TEXT,
    "tipo" "AuthEventoTipo" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE INDEX "Usuario_bloqueado_idx" ON "Usuario"("bloqueado");

-- CreateIndex
CREATE UNIQUE INDEX "Area_nombre_key" ON "Area"("nombre");

-- CreateIndex
CREATE INDEX "Area_estado_idx" ON "Area"("estado");

-- CreateIndex
CREATE INDEX "Area_orden_idx" ON "Area"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_slug_key" ON "Curso"("slug");

-- CreateIndex
CREATE INDEX "Curso_estado_idx" ON "Curso"("estado");

-- CreateIndex
CREATE INDEX "Curso_empresaCliente_idx" ON "Curso"("empresaCliente");

-- CreateIndex
CREATE INDEX "Curso_permiteInscripcionLibre_estado_idx" ON "Curso"("permiteInscripcionLibre", "estado");

-- CreateIndex
CREATE INDEX "Curso_slug_idx" ON "Curso"("slug");

-- CreateIndex
CREATE INDEX "Curso_duplicadoDeId_idx" ON "Curso"("duplicadoDeId");

-- CreateIndex
CREATE INDEX "CursoArea_cursoId_idx" ON "CursoArea"("cursoId");

-- CreateIndex
CREATE INDEX "CursoArea_areaId_idx" ON "CursoArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "CursoArea_cursoId_areaId_key" ON "CursoArea"("cursoId", "areaId");

-- CreateIndex
CREATE INDEX "Modulo_cursoId_archivadoAt_idx" ON "Modulo"("cursoId", "archivadoAt");

-- CreateIndex
CREATE INDEX "Modulo_areaId_idx" ON "Modulo"("areaId");

-- CreateIndex
CREATE INDEX "Modulo_cursoId_orden_idx" ON "Modulo"("cursoId", "orden");

-- CreateIndex
CREATE INDEX "Modulo_clonadoDeId_idx" ON "Modulo"("clonadoDeId");

-- CreateIndex
CREATE INDEX "Seccion_moduloId_orden_idx" ON "Seccion"("moduloId", "orden");

-- CreateIndex
CREATE INDEX "Seccion_moduloId_archivadoAt_idx" ON "Seccion"("moduloId", "archivadoAt");

-- CreateIndex
CREATE INDEX "Bloque_seccionId_orden_idx" ON "Bloque"("seccionId", "orden");

-- CreateIndex
CREATE INDEX "Bloque_seccionId_archivadoAt_idx" ON "Bloque"("seccionId", "archivadoAt");

-- CreateIndex
CREATE INDEX "Bloque_tipo_codigoEvaluable_idx" ON "Bloque"("tipo", "codigoEvaluable");

-- CreateIndex
CREATE UNIQUE INDEX "MiniProyecto_moduloId_key" ON "MiniProyecto"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoTransversal_cursoId_key" ON "ProyectoTransversal"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "EntrevistaIAConfig_cursoId_key" ON "EntrevistaIAConfig"("cursoId");

-- CreateIndex
CREATE INDEX "RubricaEntrevistaItem_configId_idx" ON "RubricaEntrevistaItem"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricaEntrevistaItem_configId_areaId_key" ON "RubricaEntrevistaItem"("configId", "areaId");

-- CreateIndex
CREATE INDEX "Inscripcion_participanteId_cursoId_estado_idx" ON "Inscripcion"("participanteId", "cursoId", "estado");

-- CreateIndex
CREATE INDEX "Inscripcion_cursoId_estado_idx" ON "Inscripcion"("cursoId", "estado");

-- CreateIndex
CREATE INDEX "Inscripcion_participanteId_idx" ON "Inscripcion"("participanteId");

-- CreateIndex
CREATE INDEX "Inscripcion_estado_idx" ON "Inscripcion"("estado");

-- CreateIndex
CREATE INDEX "Inscripcion_tipo_idx" ON "Inscripcion"("tipo");

-- CreateIndex
CREATE INDEX "Asignacion_moduloId_idx" ON "Asignacion"("moduloId");

-- CreateIndex
CREATE INDEX "Asignacion_inscripcionId_idx" ON "Asignacion"("inscripcionId");

-- CreateIndex
CREATE UNIQUE INDEX "Asignacion_inscripcionId_moduloId_key" ON "Asignacion"("inscripcionId", "moduloId");

-- CreateIndex
CREATE INDEX "EstadoModuloInscripcion_inscripcionId_idx" ON "EstadoModuloInscripcion"("inscripcionId");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoModuloInscripcion_inscripcionId_moduloId_key" ON "EstadoModuloInscripcion"("inscripcionId", "moduloId");

-- CreateIndex
CREATE INDEX "EvaluacionInicial_inscripcionId_idx" ON "EvaluacionInicial"("inscripcionId");

-- CreateIndex
CREATE INDEX "EvaluacionInicial_areaId_idx" ON "EvaluacionInicial"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionInicial_inscripcionId_areaId_key" ON "EvaluacionInicial"("inscripcionId", "areaId");

-- CreateIndex
CREATE INDEX "EntregaBloque_bloqueId_inscripcionId_idx" ON "EntregaBloque"("bloqueId", "inscripcionId");

-- CreateIndex
CREATE INDEX "EntregaBloque_estado_idx" ON "EntregaBloque"("estado");

-- CreateIndex
CREATE INDEX "EntregaBloque_inscripcionId_evaluadaAt_idx" ON "EntregaBloque"("inscripcionId", "evaluadaAt");

-- CreateIndex
CREATE INDEX "EntregaBloque_evaluadaPorId_evaluadaAt_idx" ON "EntregaBloque"("evaluadaPorId", "evaluadaAt");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaBloque_inscripcionId_bloqueId_intento_key" ON "EntregaBloque"("inscripcionId", "bloqueId", "intento");

-- CreateIndex
CREATE INDEX "EntregaProyecto_estado_idx" ON "EntregaProyecto"("estado");

-- CreateIndex
CREATE INDEX "EntregaProyecto_miniProyectoId_idx" ON "EntregaProyecto"("miniProyectoId");

-- CreateIndex
CREATE INDEX "EntregaProyecto_transversalId_idx" ON "EntregaProyecto"("transversalId");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaProyecto_inscripcionId_miniProyectoId_intento_key" ON "EntregaProyecto"("inscripcionId", "miniProyectoId", "intento");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaProyecto_inscripcionId_transversalId_intento_key" ON "EntregaProyecto"("inscripcionId", "transversalId", "intento");

-- CreateIndex
CREATE INDEX "DetalleCapaEvaluacion_entregaProyectoId_idx" ON "DetalleCapaEvaluacion"("entregaProyectoId");

-- CreateIndex
CREATE UNIQUE INDEX "DetalleCapaEvaluacion_entregaProyectoId_capa_key" ON "DetalleCapaEvaluacion"("entregaProyectoId", "capa");

-- CreateIndex
CREATE INDEX "AlertaIA_resueltaAt_idx" ON "AlertaIA"("resueltaAt");

-- CreateIndex
CREATE INDEX "AlertaIA_entregaProyectoId_idx" ON "AlertaIA"("entregaProyectoId");

-- CreateIndex
CREATE INDEX "AlertaIA_resueltaPorId_resueltaAt_idx" ON "AlertaIA"("resueltaPorId", "resueltaAt");

-- CreateIndex
CREATE INDEX "EntrevistaIASesion_estado_idx" ON "EntrevistaIASesion"("estado");

-- CreateIndex
CREATE INDEX "EntrevistaIASesion_inscripcionId_idx" ON "EntrevistaIASesion"("inscripcionId");

-- CreateIndex
CREATE UNIQUE INDEX "EntrevistaIASesion_inscripcionId_configId_intento_key" ON "EntrevistaIASesion"("inscripcionId", "configId", "intento");

-- CreateIndex
CREATE INDEX "ExpedienteEntry_participanteId_idx" ON "ExpedienteEntry"("participanteId");

-- CreateIndex
CREATE INDEX "ExpedienteEntry_fechaCompletitud_idx" ON "ExpedienteEntry"("fechaCompletitud");

-- CreateIndex
CREATE UNIQUE INDEX "ExpedienteEntry_participanteId_cursoId_key" ON "ExpedienteEntry"("participanteId", "cursoId");

-- CreateIndex
CREATE INDEX "ExpedienteEntryArea_entryId_idx" ON "ExpedienteEntryArea"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpedienteEntryArea_entryId_areaId_key" ON "ExpedienteEntryArea"("entryId", "areaId");

-- CreateIndex
CREATE INDEX "LogActividad_entidadTipo_entidadId_timestamp_idx" ON "LogActividad"("entidadTipo", "entidadId", "timestamp");

-- CreateIndex
CREATE INDEX "LogActividad_actorId_timestamp_idx" ON "LogActividad"("actorId", "timestamp");

-- CreateIndex
CREATE INDEX "LogActividad_tipoAccion_timestamp_idx" ON "LogActividad"("tipoAccion", "timestamp");

-- CreateIndex
CREATE INDEX "LogActividad_causaId_idx" ON "LogActividad"("causaId");

-- CreateIndex
CREATE INDEX "LogActividad_timestamp_idx" ON "LogActividad"("timestamp");

-- CreateIndex
CREATE INDEX "Notificacion_destinatarioId_leida_createdAt_idx" ON "Notificacion"("destinatarioId", "leida", "createdAt");

-- CreateIndex
CREATE INDEX "Notificacion_tipo_idx" ON "Notificacion"("tipo");

-- CreateIndex
CREATE INDEX "Notificacion_createdAt_idx" ON "Notificacion"("createdAt");

-- CreateIndex
CREATE INDEX "AuthEvento_usuarioId_createdAt_idx" ON "AuthEvento"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthEvento_tipo_createdAt_idx" ON "AuthEvento"("tipo", "createdAt");

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_duplicadoDeId_fkey" FOREIGN KEY ("duplicadoDeId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoArea" ADD CONSTRAINT "CursoArea_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoArea" ADD CONSTRAINT "CursoArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_clonadoDeId_fkey" FOREIGN KEY ("clonadoDeId") REFERENCES "Modulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seccion" ADD CONSTRAINT "Seccion_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloque" ADD CONSTRAINT "Bloque_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniProyecto" ADD CONSTRAINT "MiniProyecto_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoTransversal" ADD CONSTRAINT "ProyectoTransversal_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrevistaIAConfig" ADD CONSTRAINT "EntrevistaIAConfig_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaEntrevistaItem" ADD CONSTRAINT "RubricaEntrevistaItem_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EntrevistaIAConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaEntrevistaItem" ADD CONSTRAINT "RubricaEntrevistaItem_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstadoModuloInscripcion" ADD CONSTRAINT "EstadoModuloInscripcion_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionInicial" ADD CONSTRAINT "EvaluacionInicial_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionInicial" ADD CONSTRAINT "EvaluacionInicial_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionInicial" ADD CONSTRAINT "EvaluacionInicial_capturadaPorId_fkey" FOREIGN KEY ("capturadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaBloque" ADD CONSTRAINT "EntregaBloque_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaBloque" ADD CONSTRAINT "EntregaBloque_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "Bloque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaBloque" ADD CONSTRAINT "EntregaBloque_evaluadaPorId_fkey" FOREIGN KEY ("evaluadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProyecto" ADD CONSTRAINT "EntregaProyecto_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProyecto" ADD CONSTRAINT "EntregaProyecto_miniProyectoId_fkey" FOREIGN KEY ("miniProyectoId") REFERENCES "MiniProyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProyecto" ADD CONSTRAINT "EntregaProyecto_transversalId_fkey" FOREIGN KEY ("transversalId") REFERENCES "ProyectoTransversal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCapaEvaluacion" ADD CONSTRAINT "DetalleCapaEvaluacion_entregaProyectoId_fkey" FOREIGN KEY ("entregaProyectoId") REFERENCES "EntregaProyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaIA" ADD CONSTRAINT "AlertaIA_entregaProyectoId_fkey" FOREIGN KEY ("entregaProyectoId") REFERENCES "EntregaProyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaIA" ADD CONSTRAINT "AlertaIA_resueltaPorId_fkey" FOREIGN KEY ("resueltaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrevistaIASesion" ADD CONSTRAINT "EntrevistaIASesion_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrevistaIASesion" ADD CONSTRAINT "EntrevistaIASesion_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EntrevistaIAConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpedienteEntry" ADD CONSTRAINT "ExpedienteEntry_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpedienteEntryArea" ADD CONSTRAINT "ExpedienteEntryArea_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ExpedienteEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpedienteEntryArea" ADD CONSTRAINT "ExpedienteEntryArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogActividad" ADD CONSTRAINT "LogActividad_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogActividad" ADD CONSTRAINT "LogActividad_causaId_fkey" FOREIGN KEY ("causaId") REFERENCES "LogActividad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthEvento" ADD CONSTRAINT "AuthEvento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
