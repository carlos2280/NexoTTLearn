import { RUTAS } from "@/shared/constants/rutas"
import type { BreadcrumbCrumb } from "@/shared/ui/patterns/app-topbar"

/* Mapa estatico ruta → breadcrumbs. Para rutas dinamicas (cursos/:id, etc.)
   el detalle se inyecta desde la pagina via override. */

const MAPA: Record<string, readonly BreadcrumbCrumb[]> = {
  [RUTAS.admin.bandeja]: [{ label: "Bandeja" }],
  [RUTAS.admin.cursos]: [{ label: "Cursos" }],
}

export function resolveBreadcrumbs(pathname: string): readonly BreadcrumbCrumb[] {
  const exact = MAPA[pathname]
  if (exact) {
    return exact
  }

  // Detalles dinamicos: /admin/cursos/:id
  if (pathname.startsWith("/admin/cursos/")) {
    return [{ label: "Cursos", href: RUTAS.admin.cursos }, { label: "Detalle" }]
  }

  return []
}
