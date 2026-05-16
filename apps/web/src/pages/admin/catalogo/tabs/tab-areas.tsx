import { useListarAreas } from "@/features/catalogo/hooks/use-listar-areas"
import {
  useActualizarArea,
  useCrearArea,
  useEliminarArea,
} from "@/features/catalogo/hooks/use-mutaciones-areas"
import { Button } from "@/shared/components/ui/button"
import { DataTable } from "@/shared/components/ui/data-table"
import { Pagination } from "@/shared/components/ui/pagination"
import { SearchField } from "@/shared/components/ui/search-field"
import type { AreaResponse, CrearAreaInput } from "@nexott-learn/shared-types"
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { COLUMNAS_AREAS } from "./areas-columnas"
import { AreasEliminarDialog } from "./areas-eliminar-dialog"
import { AreasFormDialog } from "./areas-form-dialog"

interface DialogState {
  readonly modo: "cerrado" | "crear" | "editar" | "eliminar"
  readonly area: AreaResponse | null
}

const DIALOG_CERRADO: DialogState = { modo: "cerrado", area: null }

export function TabAreas() {
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(DIALOG_CERRADO)
  const pageSize = 20

  const { data, isLoading } = useListarAreas({
    page,
    pageSize,
    q: busqueda.length >= 2 ? busqueda : undefined,
  })
  const crearMut = useCrearArea()
  const actualizarMut = useActualizarArea()
  const eliminarMut = useEliminarArea()

  function cerrar() {
    setDialog(DIALOG_CERRADO)
  }

  async function guardar(input: CrearAreaInput) {
    if (dialog.modo === "crear") {
      await crearMut.mutateAsync(input)
      toast.success(`Área «${input.nombre}» creada`)
    } else if (dialog.modo === "editar" && dialog.area) {
      await actualizarMut.mutateAsync({ id: dialog.area.id, input })
      toast.success(`Área «${input.nombre}» actualizada`)
    }
    cerrar()
  }

  async function confirmarEliminar(_motivo: string) {
    if (!dialog.area) {
      return
    }
    const nombre = dialog.area.nombre
    await eliminarMut.mutateAsync(dialog.area.id)
    toast.success(`Área «${nombre}» eliminada`)
    cerrar()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          valor={busqueda}
          onCambio={(v) => {
            setBusqueda(v)
            setPage(1)
          }}
          placeholder="Buscar área por nombre o descripción…"
        />
        <Button
          variant="primary"
          size="md"
          onClick={() => setDialog({ modo: "crear", area: null })}
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
          Nueva área
        </Button>
      </div>
      <DataTable
        columnas={COLUMNAS_AREAS}
        filas={data?.data ?? []}
        obtenerKey={(a) => a.id}
        cargando={isLoading && !data}
        vacioIcono={FolderTree}
        vacioTitulo="Aún no hay áreas"
        vacioDescripcion="Crea la primera área y empieza a estructurar las skills."
        accionFila={(a) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${a.nombre}`}
              onClick={() => setDialog({ modo: "editar", area: a })}
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${a.nombre}`}
              onClick={() => setDialog({ modo: "eliminar", area: a })}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            </Button>
          </div>
        )}
      />
      <Pagination
        page={data?.meta.page ?? page}
        pageSize={data?.meta.pageSize ?? pageSize}
        total={data?.meta.total ?? 0}
        onCambiarPage={setPage}
      />
      <AreasFormDialog
        abierto={dialog.modo === "crear" || dialog.modo === "editar"}
        onCambiarAbierto={(v) => (v ? null : cerrar())}
        area={dialog.modo === "editar" ? dialog.area : null}
        onGuardar={guardar}
        enviando={crearMut.isPending || actualizarMut.isPending}
      />
      <AreasEliminarDialog
        abierto={dialog.modo === "eliminar"}
        onCambiarAbierto={(v) => (v ? null : cerrar())}
        area={dialog.area}
        onConfirmar={confirmarEliminar}
        enviando={eliminarMut.isPending}
      />
    </div>
  )
}
