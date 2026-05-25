const SEPARADOR = /\s+/

export function calcularIniciales(nombre: string): string {
  const partes = nombre.trim().split(SEPARADOR).filter(Boolean)
  const primera = partes[0]

  if (!primera) {
    return "?"
  }

  if (partes.length === 1) {
    return primera.slice(0, 2).toUpperCase()
  }

  const ultima = partes[partes.length - 1] ?? primera
  return `${primera.charAt(0)}${ultima.charAt(0)}`.toUpperCase()
}
