export function formatDate(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  })
}
