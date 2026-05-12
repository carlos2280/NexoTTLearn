import { Prisma } from "@prisma/client"

/**
 * Selects explicitos del modulo `entrevista-ia` (P8c — D-S8-D1..D6).
 *
 * El schema actual no tiene columnas `estado`, `fecha_finalizacion` ni
 * `secciones_base_snapshot` JSONB en `intentos_entrevista_ia`. La decision
 * emergente D-EMERG-P8c-1 (documentada en el reporte) congela snapshots y
 * estado interno dentro de `transcripcionOLog` (JSONB existente).
 */
export const SELECT_INTENTO_ENTREVISTA_FIELDS = {
  id: true,
  entrevistaIaId: true,
  colaboradorId: true,
  fecha: true,
  notaGlobal: true,
  aprobado: true,
  transcripcionOLog: true,
  rubricaSnapshot: true,
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
 * Incluye estado interno + snapshots ademas de los turnos para que el flujo
 * de la entrevista sea autocontenido sin DDL adicional (D-EMERG-P8c-1).
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
