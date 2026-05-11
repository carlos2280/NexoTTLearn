import type { AccionMenu } from "@/shared/components/ui/menu-acciones"
import type { CursoResumen } from "@nexott-learn/shared-types"
import { Archive, ArchiveRestore, Copy, Eye, Rocket } from "lucide-react"

export interface AccionesCursoOrq {
  readonly verDetalle: (c: CursoResumen) => void
  readonly publicar: (c: CursoResumen) => void
  readonly archivar: (c: CursoResumen) => void
  readonly desarchivar: (c: CursoResumen) => void
  readonly duplicar: (c: CursoResumen) => void
}

export function accionesPorCurso(
  c: CursoResumen,
  orq: AccionesCursoOrq,
): readonly (readonly AccionMenu[])[] {
  const verItem: AccionMenu = {
    id: "ver",
    etiqueta: "Ver detalle",
    icono: Eye,
    onClick: () => orq.verDetalle(c),
  }
  const publicarItem: AccionMenu = {
    id: "publicar",
    etiqueta: "Publicar",
    icono: Rocket,
    deshabilitada: c.estado !== "BORRADOR",
    onClick: () => orq.publicar(c),
  }
  const duplicarItem: AccionMenu = {
    id: "duplicar",
    etiqueta: "Duplicar",
    icono: Copy,
    onClick: () => orq.duplicar(c),
  }
  const archivarItem: AccionMenu = {
    id: "archivar",
    etiqueta: "Archivar",
    icono: Archive,
    deshabilitada: c.estado !== "CERRADO",
    onClick: () => orq.archivar(c),
  }
  const desarchivarItem: AccionMenu = {
    id: "desarchivar",
    etiqueta: "Desarchivar",
    icono: ArchiveRestore,
    deshabilitada: c.estado !== "ARCHIVADO",
    onClick: () => orq.desarchivar(c),
  }

  if (c.estado === "ARCHIVADO") {
    return [[verItem, duplicarItem], [desarchivarItem]]
  }
  if (c.estado === "CERRADO") {
    return [[verItem, duplicarItem], [archivarItem]]
  }
  if (c.estado === "BORRADOR") {
    return [[verItem, publicarItem, duplicarItem]]
  }
  return [[verItem, duplicarItem]]
}
