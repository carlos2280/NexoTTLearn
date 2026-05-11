import { z } from "zod"

/**
 * Replica del enum Prisma `EstadoCurso`. Mantener sincronizado.
 */
export const estadoCursoSchema = z.enum(["BORRADOR", "ACTIVO", "CERRADO", "ARCHIVADO"])
export type EstadoCurso = z.infer<typeof estadoCursoSchema>

/**
 * Replica del enum Prisma `DesbloqueoCurso`.
 */
export const desbloqueoCursoSchema = z.enum(["ENCADENADO", "SIEMPRE", "DESDE_FECHA"])
export type DesbloqueoCurso = z.infer<typeof desbloqueoCursoSchema>

/**
 * Replica del enum Prisma `AccionLogCurso`.
 */
export const accionLogCursoSchema = z.enum([
  "CAMBIO_AREAS",
  "CAMBIO_PESOS",
  "CAMBIO_OBJETIVOS",
  "TOGGLE_TRANSVERSAL",
  "TOGGLE_ENTREVISTA",
  "CAMBIO_MODULOS",
  "PUBLICACION",
  "CIERRE",
  "DESHACER_CIERRE",
  "ARCHIVADO",
  "OTRO",
])
export type AccionLogCurso = z.infer<typeof accionLogCursoSchema>

/**
 * Resumen del curso devuelto en listados (`GET /cursos`).
 */
export interface CursoResumen {
  readonly id: string
  readonly titulo: string
  readonly clienteId: string
  readonly estado: EstadoCurso
  readonly fechaInicio: string
  readonly fechaDeadline: string
  readonly fechaCierre: string | null
  readonly toggleVoluntarios: boolean
  readonly desbloqueo: DesbloqueoCurso
  readonly createdAt: string
  readonly updatedAt: string
}

/**
 * Configuracion completa del curso (`GET /cursos/:id`, POST, PATCH responses).
 * Incluye sub-recursos de configuracion ya existentes (P4a no los muta pero los
 * devuelve para que el wizard pueda leer el estado inicial tras crear).
 */
export interface CursoAreaExigida {
  readonly areaId: string
  readonly peso: number
  readonly puntajeObjetivo: number
}

export interface CursoSkillExigida {
  readonly skillId: string
  readonly notaMinima: number
}

export interface CursoModuloHabilitado {
  readonly moduloId: string
}

export interface CursoDetalle extends CursoResumen {
  readonly toggleCierreAutomatico: boolean
  readonly umbralNoCumple: number
  readonly pesoBloques: number
  readonly pesoTransversal: number
  readonly pesoEntrevista: number
  readonly transversalId: string | null
  readonly entrevistaIaId: string | null
  readonly fechaDesbloqueo: string | null
  readonly areasExigidas: readonly CursoAreaExigida[]
  readonly skillsExigidas: readonly CursoSkillExigida[]
  readonly modulosHabilitados: readonly CursoModuloHabilitado[]
}

/**
 * Fila del historial de cambios del curso (`GET /cursos/:id/log-cambios`).
 * `motivo` siempre presente: el service rellena un texto del sistema cuando
 * la mutacion no provino de un `X-Motivo` explicito (D-CUR-3 / D-CUR-4).
 */
export interface LogCambioCurso {
  readonly id: string
  readonly cursoId: string
  readonly fecha: string
  readonly autorUsuarioId: string
  readonly accion: AccionLogCurso
  readonly motivo: string
  readonly previewImpacto: Record<string, unknown> | null
}

/**
 * Respuesta de `POST /cursos/:id/duplicar`. `modulosExcluidos` enumera los
 * modulos archivados del curso fuente que NO se copiaron al destino (D-CUR-10).
 */
export interface DuplicarCursoResponse {
  readonly curso: CursoDetalle
  readonly modulosExcluidos: readonly { readonly moduloId: string; readonly titulo: string }[]
}
