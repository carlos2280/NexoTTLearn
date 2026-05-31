import { useListarPersonas } from "@/features/personas/hooks/use-listar-personas"
import { Button } from "@/shared/components/ui/button"
import { DataTable } from "@/shared/components/ui/data-table"
import { PageHeader, PageHeaderStat } from "@/shared/components/ui/page-header"
import { Pagination } from "@/shared/components/ui/pagination"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type {
  ExportarColaboradoresQuery,
  FormatoExportColaboradores,
  ListarColaboradoresQuery,
} from "@nexott-learn/shared-types"
import { Plus, Users } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { COLUMNAS_PERSONAS } from "./components/personas-columnas"
import { PersonasDialogos } from "./components/personas-dialogos"
import { PersonasExportarBoton } from "./components/personas-exportar-boton"
import { PersonasFiltros } from "./components/personas-filtros"
import { FILTROS_PERSONAS_INICIAL, type FiltrosPersonas } from "./personas.types"
import { usePersonasOrquestacion } from "./use-personas-orquestacion"

const OPCIONES_PAGE_SIZE = [10, 20, 30, 50, 100] as const
const PAGE_SIZE_INICIAL = 10

function filtrosBase(filtros: FiltrosPersonas) {
  return {
    q: filtros.busqueda.trim().length >= 2 ? filtros.busqueda.trim() : undefined,
    rol: filtros.rol === "TODOS" ? undefined : filtros.rol,
    estadoEmpleado: filtros.estadoEmpleado === "TODOS" ? undefined : filtros.estadoEmpleado,
    bloqueado: filtros.bloqueado === "TODOS" ? undefined : filtros.bloqueado === "SI",
  }
}

function aQuery(
  filtros: FiltrosPersonas,
  page: number,
  pageSize: number,
): ListarColaboradoresQuery {
  return { page, pageSize, ...filtrosBase(filtros) }
}

export function PersonasPage() {
  const [filtros, setFiltros] = useState<FiltrosPersonas>(FILTROS_PERSONAS_INICIAL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_INICIAL)
  const query = useMemo(() => aQuery(filtros, page, pageSize), [filtros, page, pageSize])
  const { data, isLoading } = useListarPersonas(query)
  const orq = usePersonasOrquestacion()

  const total = data?.meta.total ?? 0
  const hayFiltros =
    filtros.busqueda.trim().length >= 2 ||
    filtros.rol !== "TODOS" ||
    filtros.estadoEmpleado !== "TODOS" ||
    filtros.bloqueado !== "TODOS"

  const construirExportQuery = useCallback(
    (formato: FormatoExportColaboradores): ExportarColaboradoresQuery => ({
      formato,
      ...filtrosBase(filtros),
    }),
    [filtros],
  )

  function actualizarFiltros(siguiente: FiltrosPersonas) {
    setFiltros(siguiente)
    setPage(1)
  }

  function actualizarPageSize(nuevo: number) {
    setPageSize(nuevo)
    setPage(1)
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
      <PageHeader
        eyebrow="Gobierno de personas"
        titulo="Personas"
        descripcion="Da de alta colaboradores, consulta sus skills y resuelve incidencias de acceso. Cada acción deja motivo auditable."
        stat={
          <PageHeaderStat
            valor={total}
            etiqueta={hayFiltros ? "coinciden con el filtro" : "colaboradores en plataforma"}
          />
        }
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PersonasFiltros valor={filtros} onCambio={actualizarFiltros} />
          <div className="flex shrink-0 items-center gap-2">
            <PersonasExportarBoton construirQuery={construirExportQuery} />
            <Button variant="primary" size="md" onClick={() => orq.abrir("crear")}>
              <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
              Nuevo colaborador
            </Button>
          </div>
        </div>

        <DataTable
          columnas={COLUMNAS_PERSONAS}
          filas={data?.data ?? []}
          obtenerKey={(p) => p.id}
          cargando={isLoading && !data}
          vacioIcono={Users}
          vacioTitulo="Sin colaboradores con esos filtros"
          vacioDescripcion="Prueba a ampliar los filtros o crea un nuevo colaborador."
          onClickFila={(p) => orq.abrir("ver-ficha", p)}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-caption text-text-tertiary">
            <span>Filas por página</span>
            <Select
              compact={true}
              value={String(pageSize)}
              onValueChange={(v) => actualizarPageSize(Number(v))}
              aria-label="Filas por página"
              className="min-w-[88px]"
            >
              {OPCIONES_PAGE_SIZE.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </Select>
          </div>
          <Pagination
            page={data?.meta.page ?? page}
            pageSize={data?.meta.pageSize ?? pageSize}
            total={total}
            onCambiarPage={setPage}
          />
        </div>
      </section>

      <PersonasDialogos orq={orq} />
    </div>
  )
}
