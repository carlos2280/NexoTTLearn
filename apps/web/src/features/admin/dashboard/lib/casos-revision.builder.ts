import type { CasoRevision, PrioridadCaso } from "@/pages/admin/inicio/inicio.types"
import type { CursoResumen } from "@nexott-learn/shared-types"

const DIAS_URGENTE = 7
const DIAS_ALTA = 21
const MS_POR_DIA = 24 * 60 * 60 * 1000
const MAX_CASOS = 6

function diasHasta(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / MS_POR_DIA)
}

function prioridadPorDeadline(dias: number): PrioridadCaso {
  if (dias <= DIAS_URGENTE) {
    return "urgente"
  }
  if (dias <= DIAS_ALTA) {
    return "alta"
  }
  return "normal"
}

function slaTexto(dias: number): string {
  if (dias < 0) {
    return `vencido hace ${Math.abs(dias)} d`
  }
  if (dias === 0) {
    return "vence hoy"
  }
  if (dias === 1) {
    return "vence mañana"
  }
  return `vence en ${dias} d`
}

function casoBorrador(curso: CursoResumen): CasoRevision {
  const dias = diasHasta(curso.fechaDeadline)
  return {
    id: `borrador-${curso.id}`,
    titulo: `Curso «${curso.titulo}» en borrador`,
    contexto: "Esperando publicación",
    prioridad: dias <= DIAS_URGENTE ? "urgente" : "alta",
    slaRestante: slaTexto(dias),
    responsable: "Equipo Catálogo",
  }
}

function casoDeadline(curso: CursoResumen): CasoRevision {
  const dias = diasHasta(curso.fechaDeadline)
  return {
    id: `deadline-${curso.id}`,
    titulo: `«${curso.titulo}» se acerca al deadline`,
    contexto: "Curso activo con fecha límite próxima",
    prioridad: prioridadPorDeadline(dias),
    slaRestante: slaTexto(dias),
    responsable: "Equipo Catálogo",
  }
}

const ORDEN_PRIORIDAD: Record<PrioridadCaso, number> = {
  urgente: 0,
  alta: 1,
  normal: 2,
}

export function construirCasosRevision(cursos: readonly CursoResumen[]): readonly CasoRevision[] {
  const borradores = cursos.filter((c) => c.estado === "BORRADOR").map(casoBorrador)
  const deadlines = cursos
    .filter((c) => c.estado === "ACTIVO" && diasHasta(c.fechaDeadline) <= DIAS_ALTA)
    .map(casoDeadline)

  return [...borradores, ...deadlines]
    .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad])
    .slice(0, MAX_CASOS)
}
