import type { AccionMenu } from "@/shared/components/ui/menu-acciones"
import type { SkillResponse } from "@nexott-learn/shared-types"
import { Archive, ArchiveRestore, ArrowRightLeft, Combine, Pencil, Trash2 } from "lucide-react"
import type { useSkillsOrquestacion } from "./use-skills-orquestacion"

export function accionesPorSkill(
  s: SkillResponse,
  orq: ReturnType<typeof useSkillsOrquestacion>,
): readonly (readonly AccionMenu[])[] {
  const accionEstado: AccionMenu =
    s.estado === "ACTIVA"
      ? {
          id: "archivar",
          etiqueta: "Archivar",
          icono: Archive,
          onClick: () => orq.abrir("archivar", s),
        }
      : {
          id: "desarchivar",
          etiqueta: "Desarchivar",
          icono: ArchiveRestore,
          onClick: () => orq.ejecutar.desarchivar(s),
        }
  return [
    [
      {
        id: "renombrar",
        etiqueta: "Renombrar…",
        icono: Pencil,
        onClick: () => orq.abrir("renombrar", s),
      },
      {
        id: "cambiar-area",
        etiqueta: "Cambiar área…",
        icono: ArrowRightLeft,
        onClick: () => orq.abrir("cambiar-area", s),
      },
      {
        id: "fusionar",
        etiqueta: "Fusionar con…",
        icono: Combine,
        onClick: () => orq.abrir("fusionar", s),
      },
      accionEstado,
    ],
    [
      {
        id: "eliminar",
        etiqueta: "Eliminar…",
        icono: Trash2,
        destructiva: true,
        onClick: () => orq.abrir("eliminar", s),
      },
    ],
  ]
}
