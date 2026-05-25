/**
 * Helpers de formato de deadline para los cursos del participante.
 * Doc 02_mi_bandeja.md §6.1: gris si > 14 días, ámbar si 1-14 días,
 * rojo si < 1 día o vencido.
 */

export type TonoDeadline = "lejos" | "cercano" | "vencido"

export interface DeadlineFormato {
  readonly textoFecha: string
  readonly textoRelativo: string
  readonly tono: TonoDeadline
}

const MS_POR_DIA = 1000 * 60 * 60 * 24
const DIAS_CERCANO = 14

export function formatearDeadline(fechaISO: string): DeadlineFormato {
  const objetivo = new Date(fechaISO)
  const ahora = new Date()
  const diffDias = Math.round((objetivo.getTime() - ahora.getTime()) / MS_POR_DIA)

  const textoFecha = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
  }).format(objetivo)

  if (diffDias < 0) {
    const dias = Math.abs(diffDias)
    return {
      textoFecha,
      textoRelativo: `vencido hace ${dias} ${dias === 1 ? "día" : "días"}`,
      tono: "vencido",
    }
  }
  if (diffDias === 0) {
    return { textoFecha, textoRelativo: "vence hoy", tono: "vencido" }
  }
  if (diffDias <= DIAS_CERCANO) {
    return {
      textoFecha,
      textoRelativo: `en ${diffDias} ${diffDias === 1 ? "día" : "días"}`,
      tono: "cercano",
    }
  }
  return { textoFecha, textoRelativo: `en ${diffDias} días`, tono: "lejos" }
}
