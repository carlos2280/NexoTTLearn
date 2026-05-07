import type { EstadoInvitado, InscripcionDiagnosticoItem } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"

// =============================================================================
// INSCRIPCIONES DEL CURSO · listado para tab "Invitados" (Diagnostico).
// MAESTRO §6.3, §7.1 · una fila por inscripcion ACTIVA con metricas derivadas:
// estado de login del participante, cobertura de evaluacion inicial y conteo
// de asignaciones confirmadas.
// =============================================================================

export const INSCRIPCION_DIAGNOSTICO_SELECT = {
  id: true,
  cursoId: true,
  tipo: true,
  estado: true,
  inscritaAt: true,
  participante: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      ultimoLoginEn: true,
    },
  },
  evaluacionesIniciales: {
    select: { id: true },
  },
  asignaciones: {
    select: { id: true },
  },
} satisfies Prisma.InscripcionSelect

export type InscripcionDiagnosticoRow = Prisma.InscripcionGetPayload<{
  select: typeof INSCRIPCION_DIAGNOSTICO_SELECT
}>

interface MapearArgs {
  readonly row: InscripcionDiagnosticoRow
  readonly areasTotales: number
}

export function mapInscripcionDiagnostico({
  row,
  areasTotales,
}: MapearArgs): InscripcionDiagnosticoItem {
  const areasConDato = row.evaluacionesIniciales.length
  const completa = areasTotales > 0 && areasConDato >= areasTotales
  const estadoInvitado = derivarEstadoInvitado({
    ultimoLoginEn: row.participante.ultimoLoginEn,
    completa,
  })

  return {
    inscripcionId: row.id,
    cursoId: row.cursoId,
    participante: {
      id: row.participante.id,
      nombre: row.participante.nombre,
      apellido: row.participante.apellido,
      email: row.participante.email,
      ultimoLoginAt: row.participante.ultimoLoginEn
        ? row.participante.ultimoLoginEn.toISOString()
        : null,
    },
    tipo: row.tipo,
    estado: row.estado,
    estadoInvitado,
    invitadaAt: row.inscritaAt.toISOString(),
    evaluacion: { areasConDato, areasTotales, completa },
    asignacion: {
      confirmada: row.asignaciones.length > 0,
      modulosCount: row.asignaciones.length,
    },
  }
}

function derivarEstadoInvitado({
  ultimoLoginEn,
  completa,
}: {
  readonly ultimoLoginEn: Date | null
  readonly completa: boolean
}): EstadoInvitado {
  if (!ultimoLoginEn) {
    return "sin-login"
  }
  return completa ? "con-login-con-eval" : "con-login-sin-eval"
}
