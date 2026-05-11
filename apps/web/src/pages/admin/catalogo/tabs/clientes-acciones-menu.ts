import type { AccionMenu } from "@/shared/components/ui/menu-acciones"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import { Pencil, Power, Trash2 } from "lucide-react"
import type { useClientesOrquestacion } from "./use-clientes-orquestacion"

export function accionesPorCliente(
  c: ClienteResponse,
  orq: ReturnType<typeof useClientesOrquestacion>,
): readonly (readonly AccionMenu[])[] {
  return [
    [
      { id: "editar", etiqueta: "Editar…", icono: Pencil, onClick: () => orq.abrir("editar", c) },
      {
        id: "toggle",
        etiqueta: c.activo ? "Desactivar…" : "Activar…",
        icono: Power,
        onClick: () => orq.abrir("toggle-activo", c),
      },
    ],
    [
      {
        id: "eliminar",
        etiqueta: "Eliminar…",
        icono: Trash2,
        destructiva: true,
        onClick: () => orq.abrir("eliminar", c),
      },
    ],
  ]
}
