/**
 * Helpers de formato de deadline para la banda "Pendientes en tus cursos".
 * Mantiene la regla §6.1: gris si > 14 días, ámbar si 1-14 días, rojo si < 1.
 */

export type TonoDeadline = "lejos" | "cercano" | "vencido"

export interface DeadlineFormato {
  readonly textoFecha: string
  readonly textoRelativo: string
  readonly tono: TonoDeadline
}

const MS_POR_DIA = 1000 * 60 * 60 * 24

export function formatearDeadline(fechaISO: string): DeadlineFormato {
  const objetivo = new Date(fechaISO)
  const ahora = new Date()
  const diffDias = Math.round((objetivo.getTime() - ahora.getTime()) / MS_POR_DIA)

  const textoFecha = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
  }).format(objetivo)

  let textoRelativo: string
  let tono: TonoDeadline
  if (diffDias < 0) {
    textoRelativo = `vencido hace ${Math.abs(diffDias)} ${Math.abs(diffDias) === 1 ? "día" : "días"}`
    tono = "vencido"
  } else if (diffDias === 0) {
    textoRelativo = "vence hoy"
    tono = "vencido"
  } else if (diffDias <= 14) {
    textoRelativo = `en ${diffDias} ${diffDias === 1 ? "día" : "días"}`
    tono = "cercano"
  } else {
    textoRelativo = `en ${diffDias} días`
    tono = "lejos"
  }

  return { textoFecha, textoRelativo, tono }
}

/**
 * Formato compacto "hace N min/h/d" para timeline de notificaciones (§7.2).
 */
export function tiempoRelativo(fechaISO: string): string {
  const objetivo = new Date(fechaISO)
  const diffMs = Date.now() - objetivo.getTime()
  const minutos = Math.floor(diffMs / 60000)
  if (minutos < 1) {
    return "ahora"
  }
  if (minutos < 60) {
    return `hace ${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  if (horas < 24) {
    return `hace ${horas} h`
  }
  const dias = Math.floor(horas / 24)
  if (dias < 7) {
    return `hace ${dias} d`
  }
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit" }).format(objetivo)
}
