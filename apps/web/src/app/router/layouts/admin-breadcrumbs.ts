import { RUTAS } from "@/shared/constants/rutas"
import type { BreadcrumbCrumb } from "@/shared/ui/patterns/app-topbar"

/* Mapa estatico ruta → breadcrumbs. Para rutas dinamicas (cursos/:id, etc.)
   el detalle se inyecta desde la pagina via override. */

const MAPA: Record<string, readonly BreadcrumbCrumb[]> = {
  [RUTAS.admin.bandeja]: [{ label: "Bandeja" }],
  [RUTAS.admin.cursos]: [{ label: "Cursos" }],
  [RUTAS.admin.diagnosticos]: [{ label: "Diagnóstico" }],
  [RUTAS.admin.centroRevision]: [{ label: "Centro de revisión" }],
  [RUTAS.admin.seguimiento]: [{ label: "Seguimiento" }],
}

const RUTA_CANDIDATOS = /^\/admin\/cursos\/[^/]+\/candidatos$/
const RUTA_FICHA_PARTICIPANTE = /^\/admin\/seguimiento\/p\/[^/]+$/

export function resolveBreadcrumbs(pathname: string): readonly BreadcrumbCrumb[] {
  const exact = MAPA[pathname]
  if (exact) {
    return exact
  }

  // Detalles dinamicos: /admin/cursos/:id/candidatos → pertenece al flujo Diagnóstico
  if (RUTA_CANDIDATOS.test(pathname)) {
    return [{ label: "Diagnóstico", href: RUTAS.admin.diagnosticos }, { label: "Candidatos" }]
  }

  // Detalles dinamicos: /admin/cursos/:id
  if (pathname.startsWith("/admin/cursos/")) {
    return [{ label: "Cursos", href: RUTAS.admin.cursos }, { label: "Detalle" }]
  }

  // Ficha participante: /admin/seguimiento/p/:id
  if (RUTA_FICHA_PARTICIPANTE.test(pathname)) {
    return [{ label: "Seguimiento", href: RUTAS.admin.seguimiento }, { label: "Participante" }]
  }

  return []
}
