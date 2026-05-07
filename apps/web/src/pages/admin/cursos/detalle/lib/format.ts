// Formatters compartidos por la pantalla de detalle del curso.
// No hay dependencias de UI: solo strings.

const fmtFecha = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) {
    return "—"
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return fmtFecha.format(date)
}

const fmtRelativo = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

export function formatRelativo(iso: string | null | undefined): string {
  if (!iso) {
    return "—"
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  const diffMs = date.getTime() - Date.now()
  const diffMin = Math.round(diffMs / 60_000)
  const absMin = Math.abs(diffMin)
  if (absMin < 60) {
    return fmtRelativo.format(diffMin, "minute")
  }
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) {
    return fmtRelativo.format(diffHr, "hour")
  }
  const diffDay = Math.round(diffHr / 24)
  if (Math.abs(diffDay) < 30) {
    return fmtRelativo.format(diffDay, "day")
  }
  const diffMonth = Math.round(diffDay / 30)
  return fmtRelativo.format(diffMonth, "month")
}

export function formatPeso(peso: number): string {
  return `${Math.round(peso)}%`
}

export function formatPuntaje(puntaje: number): string {
  return `≥ ${Math.round(puntaje)}`
}
