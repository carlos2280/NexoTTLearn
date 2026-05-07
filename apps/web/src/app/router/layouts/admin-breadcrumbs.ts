import { RUTAS } from "@/shared/constants/rutas"
import type { BreadcrumbCrumb } from "@/shared/ui/patterns/app-topbar"

/* Mapa estatico ruta → breadcrumbs. Para rutas dinamicas (cursos/:id, etc.)
   el detalle se inyecta desde la pagina via override. */

const MAPA: Record<string, readonly BreadcrumbCrumb[]> = {
  [RUTAS.admin.bandeja]: [{ label: "Bandeja" }],
  [RUTAS.admin.cursos]: [{ label: "Cursos" }],
  [RUTAS.admin.diagnosticos]: [{ label: "Diagnóstico" }],
}

const RUTA_CANDIDATOS = /^\/admin\/cursos\/[^/]+\/candidatos$/

export function resolveBreadcrumbs(pathname: string): readonly BreadcrumbCrumb[] {
  const exact = MAPA[pathname]
  if (exact) {
    return exact
  }

  // Detalles dinamicos: /admin/cursos/:id/candidatos
  if (RUTA_CANDIDATOS.test(pathname)) {
    return [
      { label: "Cursos", href: RUTAS.admin.cursos },
      { label: "Detalle" },
      { label: "Diagnóstico" },
    ]
  }

  // Detalles dinamicos: /admin/cursos/:id
  if (pathname.startsWith("/admin/cursos/")) {
    return [{ label: "Cursos", href: RUTAS.admin.cursos }, { label: "Detalle" }]
  }

  return []
}
