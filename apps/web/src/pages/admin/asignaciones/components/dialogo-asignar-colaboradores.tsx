import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Pagination } from "@/shared/components/ui/pagination"
import { SearchField } from "@/shared/components/ui/search-field"
import type { CrearAsignacionesBatchResponse } from "@nexott-learn/shared-types"
import { ListaColaboradoresDisponibles } from "./lista-colaboradores-disponibles"
import { useDialogoAsignarColaboradores } from "./use-dialogo-asignar-colaboradores"

interface Props {
  readonly abierto: boolean
  readonly cursoId: string
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly onCompletado: (respuesta: CrearAsignacionesBatchResponse) => void
}

export function DialogoAsignarColaboradores({
  abierto,
  cursoId,
  onCambiarAbierto,
  onCompletado,
}: Props) {
  const h = useDialogoAsignarColaboradores({ cursoId, abierto, onCompletado })
  const total = h.datos?.meta.total ?? 0
  const filas = h.datos?.data ?? []

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Asignar colaboradores"
      descripcion="Busca y marca a quiénes inscribir en este curso."
      ancho="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            valor={h.busqueda}
            onCambio={h.cambiarBusqueda}
            placeholder="Buscar por nombre o email…"
            className="max-w-md flex-1"
          />
          <div className="ms-auto flex items-center gap-3">
            <span className="font-mono text-caption text-text-tertiary tabular">
              <span className="text-text-primary">{h.seleccionados.size}</span> seleccionado
              {h.seleccionados.size === 1 ? "" : "s"}
            </span>
            {h.seleccionados.size > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={h.limpiarSeleccion}
                disabled={h.enviando}
              >
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>

        <ListaColaboradoresDisponibles
          filas={filas}
          seleccionados={h.seleccionados}
          onAlternar={h.alternar}
          cargando={h.cargando}
          enviando={h.enviando}
          errorCarga={h.errorCarga !== null && h.errorCarga !== undefined}
          totalSinFiltros={total}
        />

        {total > h.pageSize ? (
          <Pagination
            page={h.page}
            pageSize={h.pageSize}
            total={total}
            onCambiarPage={h.cambiarPage}
          />
        ) : null}

        {h.error ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {h.error}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => onCambiarAbierto(false)}
          disabled={h.enviando}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={h.asignar}
          disabled={h.seleccionados.size === 0}
          isLoading={h.enviando}
        >
          Asignar {h.seleccionados.size > 0 ? `(${h.seleccionados.size})` : ""}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
