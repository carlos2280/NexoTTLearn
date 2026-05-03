export function obtenerSaludo(fecha: Date = new Date()): string {
  const hora = fecha.getHours()
  if (hora < 12) {
    return "Buenos dias"
  }
  if (hora < 19) {
    return "Buenas tardes"
  }
  return "Buenas noches"
}
