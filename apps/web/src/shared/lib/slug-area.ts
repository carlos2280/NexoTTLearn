/**
 * Mapea el nombre de un área (cualquier capitalización / formato) al slug que
 * el sistema de tokens de color reconoce (`--color-area-X-*` en `globals.css`).
 *
 * Conocidas: frontend · backend · cloud · data · mobile · devops · qa · soft.
 * Si el área tiene otro nombre, cae al fallback más cercano por keywords.
 * Si no hay match, devuelve `soft` (un color neutro válido del sistema).
 */
const AREAS_CONOCIDAS: ReadonlySet<string> = new Set([
  "frontend",
  "backend",
  "cloud",
  "data",
  "mobile",
  "devops",
  "qa",
  "soft",
])

export type SlugArea =
  | "frontend"
  | "backend"
  | "cloud"
  | "data"
  | "mobile"
  | "devops"
  | "qa"
  | "soft"

export function slugArea(nombre: string | null | undefined): SlugArea {
  if (!nombre) {
    return "soft"
  }
  const s = nombre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  if (AREAS_CONOCIDAS.has(s)) {
    return s as SlugArea
  }
  if (s.includes("front")) {
    return "frontend"
  }
  if (s.includes("back")) {
    return "backend"
  }
  if (s.includes("cloud") || s.includes("nube")) {
    return "cloud"
  }
  if (s.includes("data") || s.includes("dato")) {
    return "data"
  }
  if (s.includes("mobile") || s.includes("movil") || s.includes("móvil")) {
    return "mobile"
  }
  if (s.includes("devops") || s.includes("infra")) {
    return "devops"
  }
  if (s.includes("qa") || s.includes("test") || s.includes("calidad")) {
    return "qa"
  }
  return "soft"
}
