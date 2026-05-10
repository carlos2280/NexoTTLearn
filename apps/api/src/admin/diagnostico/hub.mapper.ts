import type {
  EstadoDiagnosticoHub,
  HubDiagnosticoItem,
  TabSugeridoHub,
} from "@nexott-learn/shared-types"

// Forma cruda que llega del service tras consolidar las queries de Prisma.
// Mantener flat para que mapHubItem sea solo logica de derivacion.
export interface HubItemRaw {
  readonly cursoId: string
  readonly empresaCliente: string
  readonly titulo: string
  readonly deadline: Date | null
  readonly invitados: number
  readonly inscripcionesIds: readonly string[]
  readonly inscripcionesConEvaluacion: ReadonlySet<string>
  readonly inscripcionesConAsignacion: ReadonlySet<string>
}

export function mapHubItem(raw: HubItemRaw, hoy: Date): HubDiagnosticoItem {
  const sinEvaluacion = raw.inscripcionesIds.filter(
    (id) => !raw.inscripcionesConEvaluacion.has(id),
  ).length
  const sinAsignacion = raw.inscripcionesIds.filter(
    (id) => !raw.inscripcionesConAsignacion.has(id),
  ).length

  const diasRestantes = raw.deadline ? diasEntre(hoy, raw.deadline) : null
  const tabSugerido = elegirTabSugerido(raw.invitados, sinEvaluacion, sinAsignacion)
  const estadoDiagnostico = elegirEstado(raw.invitados, sinEvaluacion, sinAsignacion)

  return {
    cursoId: raw.cursoId,
    empresaCliente: raw.empresaCliente,
    titulo: raw.titulo,
    deadline: raw.deadline ? raw.deadline.toISOString() : null,
    diasRestantes,
    contadores: {
      invitados: raw.invitados,
      sinEvaluacion,
      sinAsignacion,
    },
    estadoDiagnostico,
    tabSugerido,
  }
}

function diasEntre(desde: Date, hasta: Date): number {
  const ms = hasta.getTime() - desde.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function elegirTabSugerido(
  invitados: number,
  sinEvaluacion: number,
  sinAsignacion: number,
): TabSugeridoHub {
  if (invitados === 0) return 1
  if (sinEvaluacion > 0) return 2
  if (sinAsignacion > 0) return 3
  return 3
}

function elegirEstado(
  invitados: number,
  sinEvaluacion: number,
  sinAsignacion: number,
): EstadoDiagnosticoHub {
  if (invitados === 0) return "sin-invitados"
  if (sinEvaluacion === 0 && sinAsignacion === 0) return "al-dia"
  return "pendiente"
}
