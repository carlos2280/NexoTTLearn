// Formato de tiempo relativo en es-CL para meta de novedades.

export function tiempoRelativo(fecha: Date, ahora: Date): string {
  const diffMs = ahora.getTime() - fecha.getTime()
  if (diffMs < 60_000) {
    return "ahora"
  }
  const minutos = Math.floor(diffMs / 60_000)
  if (minutos < 60) {
    return `hace ${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  if (horas < 24) {
    return `hace ${horas} h`
  }
  const dias = Math.floor(horas / 24)
  if (dias < 30) {
    return `hace ${dias} d`
  }
  return `hace ${Math.floor(dias / 30)} mes`
}
