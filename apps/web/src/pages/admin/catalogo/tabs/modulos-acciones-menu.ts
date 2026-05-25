import type { AccionMenu } from "@/shared/components/ui/menu-acciones"
import type { ModuloResponse } from "@nexott-learn/shared-types"
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react"
import type { useModulosOrquestacion } from "./use-modulos-orquestacion"

export function accionesPorModulo(
  m: ModuloResponse,
  orq: ReturnType<typeof useModulosOrquestacion>,
): readonly (readonly AccionMenu[])[] {
  const accionEstado: AccionMenu =
    m.estado === "ACTIVO"
      ? {
          id: "archivar",
          etiqueta: "Archivar…",
          icono: Archive,
          onClick: () => orq.abrir("archivar", m),
        }
      : {
          id: "desarchivar",
          etiqueta: "Desarchivar…",
          icono: ArchiveRestore,
          onClick: () => orq.abrir("desarchivar", m),
        }
  return [
    [
      { id: "editar", etiqueta: "Editar…", icono: Pencil, onClick: () => orq.abrir("editar", m) },
      accionEstado,
    ],
    [
      {
        id: "eliminar",
        etiqueta: "Eliminar…",
        icono: Trash2,
        destructiva: true,
        onClick: () => orq.abrir("eliminar", m),
      },
    ],
  ]
}
