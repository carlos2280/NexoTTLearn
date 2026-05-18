const MIN_MS = 60 * 1000
const HORA_MS = 60 * MIN_MS
const DIA_MS = 24 * HORA_MS
const SEMANA_MS = 7 * DIA_MS
const MES_MS = 30 * DIA_MS
const ANIO_MS = 365 * DIA_MS

/**
 * Devuelve la fecha relativa con la granularidad apropiada al rango:
 * minutos / horas dentro del dia, dias / semanas / meses / años despues.
 * Pensado para notificaciones y eventos del timeline.
 */
export function relativizarFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    return ""
  }
  const diff = Date.now() - fecha.getTime()
  if (diff < MIN_MS) {
    return "ahora"
  }
  if (diff < HORA_MS) {
    const min = Math.floor(diff / MIN_MS)
    return `hace ${min} min`
  }
  if (diff < DIA_MS) {
    const h = Math.floor(diff / HORA_MS)
    return h === 1 ? "hace 1 h" : `hace ${h} h`
  }
  if (diff < 2 * DIA_MS) {
    return "hace 1 día"
  }
  if (diff < SEMANA_MS) {
    return `hace ${Math.floor(diff / DIA_MS)} días`
  }
  if (diff < 2 * SEMANA_MS) {
    return "hace 1 semana"
  }
  if (diff < MES_MS) {
    return `hace ${Math.floor(diff / SEMANA_MS)} semanas`
  }
  if (diff < 2 * MES_MS) {
    return "hace 1 mes"
  }
  if (diff < ANIO_MS) {
    return `hace ${Math.floor(diff / MES_MS)} meses`
  }
  const anios = Math.floor(diff / ANIO_MS)
  return anios === 1 ? "hace 1 año" : `hace ${anios} años`
}
