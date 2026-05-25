/**
 * Contratos publicos del recurso Asignacion (Slice 6). Tipos compartidos
 * api↔web. La autoridad del modelo fisico es §3.23-§3.24 (NexoTTLearn).
 *
 * Una sola tabla `asignaciones_curso` con columna `rol` (D-AS-1). Estados
 * mutuamente excluyentes: `estado_asignado` cuando rol=ASIGNADO,
 * `estado_voluntario` cuando rol=VOLUNTARIO. Defensa en BD via CHECK
 * `chk_asig_rol_estado` (D-AS-3).
 */

import { z } from "zod"

export const rolAsignacionSchema = z.enum(["ASIGNADO", "VOLUNTARIO"])
export type RolAsignacion = z.infer<typeof rolAsignacionSchema>

export const origenVoluntarioSchema = z.enum(["INICIATIVA", "REUTILIZACION"])
export type OrigenVoluntario = z.infer<typeof origenVoluntarioSchema>

export const estadoAsignadoSchema = z.enum([
  "ASIGNADO",
  "EN_PROGRESO",
  "LISTO",
  "APTO",
  "NO_APTO",
  "RETIRADO",
])
export type EstadoAsignado = z.infer<typeof estadoAsignadoSchema>

export const estadoVoluntarioSchema = z.enum([
  "INSCRITO",
  "EN_PROGRESO",
  "LISTO",
  "COMPLETADO",
  "RETIRADO",
])
export type EstadoVoluntario = z.infer<typeof estadoVoluntarioSchema>

export const resultadoEntrevistaClienteSchema = z.enum(["PENDIENTE", "PASO", "NO_PASO"])
export type ResultadoEntrevistaCliente = z.infer<typeof resultadoEntrevistaClienteSchema>

/**
 * Datos del colaborador embebidos en cada Asignacion para los listados
 * (contrato HTTP §"Listados"). Evita N+1 en el frontend.
 */
export interface AsignacionColaboradorEmbed {
  readonly id: string
  readonly nombreCompleto: string
  readonly email: string
}

export interface Asignacion {
  readonly id: string
  readonly colaboradorId: string
  readonly cursoId: string
  readonly rol: RolAsignacion
  readonly origenVoluntario: OrigenVoluntario | null
  readonly estadoAsignado: EstadoAsignado | null
  readonly estadoVoluntario: EstadoVoluntario | null
  readonly fechaInicio: string | null
  readonly fechaCierre: string | null
  readonly resultadoEntrevistaCliente: ResultadoEntrevistaCliente | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly colaborador: AsignacionColaboradorEmbed
}

export interface AsignacionHistoricoEntrada {
  readonly fecha: string
  readonly estadoAnterior: string
  readonly estadoNuevo: string
  readonly motivo: string | null
}

export interface AsignacionDetallada extends Asignacion {
  readonly observacionesAdmin: string | null
  readonly observacionesCliente: string | null
  readonly fechaEntrevistaCliente: string | null
  readonly historicoEstados: readonly AsignacionHistoricoEntrada[]
}

/**
 * Pintura compacta de un area embebida en payloads externos (D-CAT-AREA-1).
 * `codigo` es el slug estable que el frontend usa para resolver tinta + glow
 * (token CSS `--color-area-<codigo>` / `--shadow-glow-area-<codigo>`).
 */
export interface AreaTagEmbed {
  readonly id: string
  readonly nombre: string
  readonly codigo: string
}

/**
 * Skill destacada embebida en el item del catalogo de voluntariado para que el
 * participante pueda decidir "este curso me suma" sin abrir nada. El `areaCodigo`
 * permite pintar el chip con la tinta correspondiente.
 */
export interface SkillDestacadaEmbed {
  readonly id: string
  readonly etiquetaVisible: string
  readonly areaCodigo: string
}

/**
 * Item de la bandeja del participante en `GET /cursos/disponibles-voluntario`.
 * D90: no se exponen nombres de otros voluntarios — solo el contador agregado.
 *
 * `areaPrincipal` = la `CursoAreaExigida` con mayor `peso` (desempate por
 * nombre asc). `areasSecundarias` = el resto ordenadas por peso desc, max 2.
 * `skillsDestacadas` = top 4 de `CursoSkillExigida` por `notaMinima` desc
 * (desempate alfabetico por etiqueta). Estos calculos viven en el service.
 */
export interface CursoDisponibleVoluntario {
  readonly cursoId: string
  readonly titulo: string
  readonly cliente: {
    readonly id: string
    readonly nombre: string
  }
  readonly fechaInicio: string
  readonly fechaDeadline: string
  readonly voluntariosInscritos: number
  readonly areaPrincipal: AreaTagEmbed
  readonly areasSecundarias: readonly AreaTagEmbed[]
  readonly skillsDestacadas: readonly SkillDestacadaEmbed[]
}

/**
 * Motivos por los que un colaborador puede ser rechazado en el alta admin
 * batch (`POST /cursos/:id/asignaciones`).
 */
export const motivoRechazoAsignacionSchema = z.enum(["EX_EMPLEADO", "YA_INSCRITO", "NO_ENCONTRADO"])
export type MotivoRechazoAsignacion = z.infer<typeof motivoRechazoAsignacionSchema>

export interface AsignacionRechazada {
  readonly colaboradorId: string
  readonly motivo: MotivoRechazoAsignacion
}

export interface CrearAsignacionesBatchResponse {
  readonly creadas: readonly Asignacion[]
  readonly rechazadas: readonly AsignacionRechazada[]
}
