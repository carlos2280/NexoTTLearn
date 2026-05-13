import type { CasoRevision, PrioridadCaso } from "@/pages/admin/inicio/inicio.types"
import type {
  CentroRevisionResponse,
  FilaCentroRevisionEntrevistaIa,
  FilaCentroRevisionTransversal,
  MotivoRevisionEntrevistaIa,
  MotivoRevisionTransversal,
} from "@nexott-learn/shared-types"

const DIAS_URGENTE = 7
const DIAS_ALTA = 3
const MS_POR_DIA = 24 * 60 * 60 * 1000
const MAX_CASOS = 6

function textoMotivoTransversal(motivo: MotivoRevisionTransversal): string {
  switch (motivo) {
    case "CAPA_PENDIENTE_TESTS":
      return "Falta cargar capa de tests"
    case "CAPA_PENDIENTE_CUALITATIVA":
      return "Falta cargar capa cualitativa"
    case "CAPA_PENDIENTE_COMPRENSION":
      return "Falta cargar capa de comprensión"
    default: {
      const exhaustivo: never = motivo
      return exhaustivo
    }
  }
}

function textoMotivoEntrevistaIa(motivo: MotivoRevisionEntrevistaIa): string {
  switch (motivo) {
    case "AJUSTE_ADMIN_PENDIENTE":
      return "Ajuste de admin pendiente"
    default: {
      const exhaustivo: never = motivo
      return exhaustivo
    }
  }
}

const ORDEN_PRIORIDAD: Record<PrioridadCaso, number> = {
  urgente: 0,
  alta: 1,
  normal: 2,
}

function diasEspera(isoFinalizacion: string | null): number {
  if (!isoFinalizacion) {
    return 0
  }
  return Math.floor((Date.now() - new Date(isoFinalizacion).getTime()) / MS_POR_DIA)
}

function prioridadPorEspera(dias: number): PrioridadCaso {
  if (dias >= DIAS_URGENTE) {
    return "urgente"
  }
  if (dias >= DIAS_ALTA) {
    return "alta"
  }
  return "normal"
}

function textoEspera(dias: number): string {
  if (dias <= 0) {
    return "esperando hoy"
  }
  if (dias === 1) {
    return "espera 1 día"
  }
  return `espera ${dias} días`
}

function casoTransversal(fila: FilaCentroRevisionTransversal): CasoRevision {
  const dias = diasEspera(fila.fechaFinalizacion)
  return {
    id: `transversal-${fila.intentoId}`,
    titulo: `Transversal de ${fila.colaborador.nombre}`,
    contexto: textoMotivoTransversal(fila.motivoRevision),
    prioridad: prioridadPorEspera(dias),
    slaRestante: textoEspera(dias),
    responsable: "Equipo evaluación",
  }
}

function casoEntrevistaIa(fila: FilaCentroRevisionEntrevistaIa): CasoRevision {
  const dias = diasEspera(fila.fechaFinalizacion)
  return {
    id: `entrevista-ia-${fila.intentoId}`,
    titulo: `Entrevista IA de ${fila.colaborador.nombre}`,
    contexto: textoMotivoEntrevistaIa(fila.motivoRevision),
    prioridad: prioridadPorEspera(dias),
    slaRestante: textoEspera(dias),
    responsable: "Admin",
  }
}

export function construirCasosRevision(
  respuesta: CentroRevisionResponse | undefined,
): readonly CasoRevision[] {
  if (!respuesta) {
    return []
  }

  const transversales = respuesta.transversales.map(casoTransversal)
  const entrevistas = respuesta.entrevistasIa.map(casoEntrevistaIa)

  return [...transversales, ...entrevistas]
    .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad])
    .slice(0, MAX_CASOS)
}
