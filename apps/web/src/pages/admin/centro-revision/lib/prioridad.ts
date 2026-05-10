import type { EntregaBloqueListItemAdmin } from "@nexott-learn/shared-types"

type Severidad = "alta" | "media" | "baja"

export function calcularSeveridadBloque(item: EntregaBloqueListItemAdmin): Severidad {
  const edadDias = Math.floor(
    (Date.now() - new Date(item.enviadaAt).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (edadDias > 5) {
    return "alta"
  }
  if (edadDias >= 2) {
    return "media"
  }
  return "baja"
}

export function calcularScoreBloque(item: EntregaBloqueListItemAdmin): number {
  const edadDias = Math.floor(
    (Date.now() - new Date(item.enviadaAt).getTime()) / (1000 * 60 * 60 * 24),
  )
  const severidadPeso = { alta: 100, media: 50, baja: 0 }[calcularSeveridadBloque(item)]
  return severidadPeso + edadDias * 10
}

export function ordenarEntregasBloque(
  items: EntregaBloqueListItemAdmin[],
): EntregaBloqueListItemAdmin[] {
  return [...items].sort((a, b) => calcularScoreBloque(b) - calcularScoreBloque(a))
}

export function edadRelativa(fechaIso: string): string {
  const segundos = Math.floor((Date.now() - new Date(fechaIso).getTime()) / 1000)
  if (segundos < 60) {
    return "Hace un momento"
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return `Hace ${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  if (horas < 24) {
    return `Hace ${horas}h`
  }
  const dias = Math.floor(horas / 24)
  if (dias === 1) {
    return "Hace 1 día"
  }
  return `Hace ${dias} días`
}
