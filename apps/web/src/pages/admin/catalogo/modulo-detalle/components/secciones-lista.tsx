import { Button } from "@/shared/components/ui/button"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { SeccionResponse } from "@nexott-learn/shared-types"
import { ArrowDown, ArrowUp, Layers, Pencil, Trash2 } from "lucide-react"

interface SeccionesListaProps {
  readonly secciones: readonly SeccionResponse[]
  readonly cargando: boolean
  readonly reordenando: boolean
  readonly onEditar: (s: SeccionResponse) => void
  readonly onEliminar: (s: SeccionResponse) => void
  readonly onMover: (s: SeccionResponse, direccion: -1 | 1) => void
}

export function SeccionesLista({
  secciones,
  cargando,
  reordenando,
  onEditar,
  onEliminar,
  onMover,
}: SeccionesListaProps) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    )
  }

  if (secciones.length === 0) {
    return (
      <EmptyState
        icono={Layers}
        titulo="Aún no hay secciones"
        descripcion="Crea la primera sección con el botón de arriba. Las secciones agrupan los bloques de aprendizaje del módulo."
      />
    )
  }

  return (
    <ol className="flex flex-col gap-2">
      {secciones.map((s, idx) => {
        const esPrimera = idx === 0
        const esUltima = idx === secciones.length - 1
        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
          >
            <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-subtle font-medium text-caption text-text-secondary">
              {s.orden}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-body-sm text-text-primary">
                {s.titulo}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mover hacia arriba"
                disabled={esPrimera || reordenando}
                onClick={() => onMover(s, -1)}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mover hacia abajo"
                disabled={esUltima || reordenando}
                onClick={() => onMover(s, 1)}
              >
                <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              </Button>
            </div>
            <MenuAcciones
              etiquetaAria={`Acciones de ${s.titulo}`}
              grupos={[
                [
                  {
                    id: "editar",
                    etiqueta: "Editar título",
                    icono: Pencil,
                    onClick: () => onEditar(s),
                  },
                ],
                [
                  {
                    id: "eliminar",
                    etiqueta: "Eliminar",
                    icono: Trash2,
                    destructiva: true,
                    onClick: () => onEliminar(s),
                  },
                ],
              ]}
            />
          </li>
        )
      })}
    </ol>
  )
}
