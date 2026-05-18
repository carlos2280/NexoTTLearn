import { useListarIntentosEntrevistaIaPorCurso } from "@/features/entrevista-ia/hooks/use-listar-intentos-entrevista-ia-curso"
import { Badge } from "@/shared/components/ui/badge"
import { type ColumnaTabla, DataTable } from "@/shared/components/ui/data-table"
import { Pagination } from "@/shared/components/ui/pagination"
import { RUTAS } from "@/shared/constants/rutas"
import type {
  EstadoIntentoEntrevistaIa,
  IntentoEntrevistaIaListadoItem,
  ListarIntentosEntrevistaIaCursoQuery,
} from "@nexott-learn/shared-types"
import { GraduationCap } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiltrosEvaluaciones } from "./filtros-evaluaciones"
import {
  FILTROS_EVALUACIONES_INICIAL,
  type FiltrosEvaluacionesValor,
  type OpcionEstado,
} from "./filtros-evaluaciones.types"
import { aplicarFiltroAprobado, mapearEstadoAQuery, useFormatearFecha } from "./shared-helpers"

const OPCIONES_ESTADO: readonly OpcionEstado[] = [
  { value: "TODOS", etiqueta: "Todos los estados" },
  { value: "EN_PROGRESO", etiqueta: "En progreso" },
  { value: "FINALIZADO", etiqueta: "Finalizado" },
  { value: "ANULADO", etiqueta: "Anulado" },
]

const TONO_ESTADO: ReadonlyMap<EstadoIntentoEntrevistaIa, "neutro" | "success" | "danger"> =
  new Map([
    ["EN_PROGRESO", "neutro"],
    ["FINALIZADO", "success"],
    ["ANULADO", "danger"],
  ])

const ETIQUETA_ESTADO: ReadonlyMap<EstadoIntentoEntrevistaIa, string> = new Map([
  ["EN_PROGRESO", "En progreso"],
  ["FINALIZADO", "Finalizado"],
  ["ANULADO", "Anulado"],
])

interface Props {
  readonly cursoId: string
}

export function TablaIntentosEntrevistaIa({ cursoId }: Props) {
  const [page, setPage] = useState(1)
  const [filtros, setFiltros] = useState<FiltrosEvaluacionesValor>(FILTROS_EVALUACIONES_INICIAL)
  const navigate = useNavigate()
  const formatearFecha = useFormatearFecha()

  const query: ListarIntentosEntrevistaIaCursoQuery = useMemo(
    () => ({
      page,
      pageSize: 20,
      estado: mapearEstadoAQuery<EstadoIntentoEntrevistaIa>(filtros.estado, [
        "EN_PROGRESO",
        "FINALIZADO",
        "ANULADO",
      ]),
      busqueda: filtros.busqueda.trim() || undefined,
    }),
    [page, filtros],
  )
  const { data, isLoading } = useListarIntentosEntrevistaIaPorCurso(cursoId, query)
  const itemsFiltrados = useMemo(
    () => aplicarFiltroAprobado(data?.data ?? [], filtros.aprobado),
    [data, filtros.aprobado],
  )

  const columnas: readonly ColumnaTabla<IntentoEntrevistaIaListadoItem>[] = [
    { id: "colaborador", cabecera: "Colaborador", accesor: (f) => f.colaborador.nombre },
    {
      id: "estado",
      cabecera: "Estado",
      accesor: (f) => (
        <Badge tono={TONO_ESTADO.get(f.estado) ?? "neutro"} conPunto={false}>
          {ETIQUETA_ESTADO.get(f.estado) ?? f.estado}
        </Badge>
      ),
    },
    {
      id: "nota",
      cabecera: "Nota",
      alineado: "derecha",
      accesor: (f) => {
        const nota = f.notaAjustadaAdmin ?? f.notaGlobal
        return nota === null ? <span className="text-text-tertiary">—</span> : `${nota}/100`
      },
    },
    { id: "fecha", cabecera: "Fecha", accesor: (f) => formatearFecha(f.fecha) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <FiltrosEvaluaciones
        valor={filtros}
        opcionesEstado={OPCIONES_ESTADO}
        onCambio={(v) => {
          setFiltros(v)
          setPage(1)
        }}
      />
      <DataTable
        columnas={columnas}
        filas={itemsFiltrados}
        obtenerKey={(f) => f.intentoId}
        cargando={isLoading}
        vacioIcono={GraduationCap}
        vacioTitulo="Sin intentos"
        vacioDescripcion="Aún no hay intentos de entrevista IA que coincidan con los filtros."
        onClickFila={(f) => navigate(RUTAS.admin.intentoEntrevistaIa(f.intentoId))}
      />
      {data ? (
        <Pagination
          page={data.meta.page}
          pageSize={data.meta.pageSize}
          total={data.meta.total}
          onCambiarPage={setPage}
        />
      ) : null}
    </div>
  )
}
