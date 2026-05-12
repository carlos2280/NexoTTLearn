import { Prisma } from "@prisma/client"

/**
 * Selects explicitos del modulo `entrevista-ia` (P8c — D-S8-D1..D6).
 *
 * FIX-P8-cierre §5.119: el schema ya tiene columnas dedicadas para `estado`,
 * `fechaFinalizacion` y `seccionesBaseSnapshot`. La SoT pasa a las columnas;
 * `transcripcionOLog` mantiene la duplicacion temporalmente como sombra
 * (eliminacion de la duplicacion = deuda separada fuera del cierre).
 */
export const SELECT_INTENTO_ENTREVISTA_FIELDS = {
  id: true,
  entrevistaIaId: true,
  colaboradorId: true,
  fecha: true,
  fechaFinalizacion: true,
  estado: true,
  notaGlobal: true,
  aprobado: true,
  transcripcionOLog: true,
  rubricaSnapshot: true,
  seccionesBaseSnapshot: true,
  notaAjustadaAdmin: true,
  anulado: true,
  motivoAjusteOAnulacion: true,
  notasPorArea: {
    select: { areaId: true, nota: true },
  },
  entrevistaIA: {
    select: {
      cursoId: true,
      profundidad: true,
      umbralAprobacion: true,
      rubrica: {
        select: { areaId: true, peso: true },
      },
    },
  },
} as const satisfies Prisma.IntentoEntrevistaIASelect

export type IntentoEntrevistaSeleccionado = Prisma.IntentoEntrevistaIAGetPayload<{
  select: typeof SELECT_INTENTO_ENTREVISTA_FIELDS
}>

/**
 * Estructura persistida en `intentos_entrevista_ia.transcripcion_o_log`.
 * Mantenemos `estado`/`fechaFinalizacion`/`seccionesBaseSnapshot` aqui como
 * sombra de las columnas dedicadas (§5.119) para compatibilidad con la lectura
 * actual y para que el flujo de la entrevista pueda inspeccionar el snapshot
 * de areas sin volver a leer la fila.
 */
export interface TranscripcionInterna {
  readonly estado: "EN_PROGRESO" | "FINALIZADO"
  readonly rubricaSnapshot: Record<string, unknown>
  readonly seccionesBaseSnapshot: Record<string, unknown>
  readonly turnos: ReadonlyArray<{
    readonly rol: "ASISTENTE" | "COLABORADOR"
    readonly mensaje: string
    readonly timestamp: string
  }>
  readonly fechaFinalizacion: string | null
}
