import { EstadoAsignado, EstadoVoluntario, type Prisma, RolAsignacion } from "@prisma/client"
import { literalEstado } from "./asignaciones.helpers"

/**
 * Motivos del historico para la transicion automatica a EN_PROGRESO. La
 * primera actividad real de la persona en el curso la dispara: su primera
 * respuesta (intento de bloque) o su primera seccion abierta.
 */
export const MOTIVO_TRANSICION_POR_INTENTO = "TRANSICION_AUTOMATICA_POR_INTENTO" as const
export const MOTIVO_TRANSICION_POR_APERTURA = "TRANSICION_AUTOMATICA_POR_APERTURA" as const

interface TransicionEnProgresoInput {
  readonly asignacionId: string
  readonly rol: RolAsignacion
  readonly autorUsuarioId: string
  readonly motivo: typeof MOTIVO_TRANSICION_POR_INTENTO | typeof MOTIVO_TRANSICION_POR_APERTURA
  readonly fechaInicio: Date
}

/**
 * Pasa la asignacion de su estado inicial (ASIGNADO / INSCRITO) a EN_PROGRESO
 * y escribe el historico. Race-safe e idempotente: el `updateMany` lleva el
 * estado origen en el WHERE, asi que si ya avanzo no hace nada y no escribe
 * historico. No emite notificaciones. Devuelve `true` si transiciono.
 */
export async function pasarAEnProgresoSiCorresponde(
  tx: Prisma.TransactionClient,
  input: TransicionEnProgresoInput,
): Promise<boolean> {
  const esAsignado = input.rol === RolAsignacion.ASIGNADO
  const { count } = await tx.asignacionCurso.updateMany({
    where: esAsignado
      ? { id: input.asignacionId, rol: input.rol, estadoAsignado: EstadoAsignado.ASIGNADO }
      : { id: input.asignacionId, rol: input.rol, estadoVoluntario: EstadoVoluntario.INSCRITO },
    data: esAsignado
      ? { estadoAsignado: EstadoAsignado.EN_PROGRESO, fechaInicio: input.fechaInicio }
      : { estadoVoluntario: EstadoVoluntario.EN_PROGRESO, fechaInicio: input.fechaInicio },
  })
  if (count !== 1) {
    return false
  }
  await tx.historicoEstadoAsignacion.create({
    data: {
      asignacionId: input.asignacionId,
      estadoAnterior: esAsignado
        ? literalEstado(input.rol, EstadoAsignado.ASIGNADO, null)
        : literalEstado(input.rol, null, EstadoVoluntario.INSCRITO),
      estadoNuevo: esAsignado
        ? literalEstado(input.rol, EstadoAsignado.EN_PROGRESO, null)
        : literalEstado(input.rol, null, EstadoVoluntario.EN_PROGRESO),
      motivo: input.motivo,
      autorUsuarioId: input.autorUsuarioId,
    },
  })
  return true
}
