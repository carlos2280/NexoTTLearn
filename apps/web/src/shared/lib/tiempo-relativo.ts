/**
 * Formato compacto "hace N min/h/d" para timelines (notificaciones, actividad).
 * A partir de 7 días, vuelve a fecha absoluta DD/MM.
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
