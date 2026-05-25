import { useListarIntentosTransversalPorCurso } from "@/features/transversal/hooks/use-listar-intentos-transversal-curso"
import { Badge } from "@/shared/components/ui/badge"
import { type ColumnaTabla, DataTable } from "@/shared/components/ui/data-table"
import { Pagination } from "@/shared/components/ui/pagination"
import { RUTAS } from "@/shared/constants/rutas"
import type {
  EstadoIntentoTransversal,
  IntentoTransversalListadoItem,
  ListarIntentosTransversalCursoQuery,
} from "@nexott-learn/shared-types"
import { Boxes } from "lucide-react"
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
  { value: "EN_EVALUACION", etiqueta: "En evaluación" },
  { value: "EVALUADO", etiqueta: "Listo para finalizar" },
  { value: "FINALIZADO", etiqueta: "Finalizado" },
  { value: "ANULADO", etiqueta: "Anulado" },
]

const TONO_ESTADO: ReadonlyMap<
  EstadoIntentoTransversal,
  "neutro" | "success" | "danger" | "warning"
> = new Map([
  ["EN_EVALUACION", "warning"],
  ["EVALUADO", "neutro"],
  ["FINALIZADO", "success"],
  ["ANULADO", "danger"],
])

const ETIQUETA_ESTADO: ReadonlyMap<EstadoIntentoTransversal, string> = new Map([
  ["EN_EVALUACION", "En evaluación"],
  ["EVALUADO", "Listo para finalizar"],
  ["FINALIZADO", "Finalizado"],
  ["ANULADO", "Anulado"],
])

interface Props {
  readonly cursoId: string
}

export function TablaIntentosTransversal({ cursoId }: Props) {
  const [page, setPage] = useState(1)
  const [filtros, setFiltros] = useState<FiltrosEvaluacionesValor>(FILTROS_EVALUACIONES_INICIAL)
  const navigate = useNavigate()
  const formatearFecha = useFormatearFecha()

  const query: ListarIntentosTransversalCursoQuery = useMemo(
    () => ({
      page,
      pageSize: 20,
      estado: mapearEstadoAQuery<EstadoIntentoTransversal>(filtros.estado, [
        "EN_EVALUACION",
        "EVALUADO",
        "FINALIZADO",
        "ANULADO",
      ]),
      busqueda: filtros.busqueda.trim() || undefined,
    }),
    [page, filtros],
  )
  const { data, isLoading } = useListarIntentosTransversalPorCurso(cursoId, query)
  const itemsFiltrados = useMemo(
    () => aplicarFiltroAprobado(data?.data ?? [], filtros.aprobado),
    [data, filtros.aprobado],
  )

  const columnas: readonly ColumnaTabla<IntentoTransversalListadoItem>[] = [
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
      id: "capas",
      cabecera: "Capas",
      alineado: "centrado",
      accesor: (f) => <span className="tabular text-text-secondary">{f.capasCargadas}/3</span>,
    },
    {
      id: "nota",
      cabecera: "Nota",
      alineado: "derecha",
      accesor: (f) =>
        f.notaGlobal === null ? (
          <span className="text-text-tertiary">—</span>
        ) : (
          `${f.notaGlobal}/100`
        ),
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
        vacioIcono={Boxes}
        vacioTitulo="Sin intentos"
        vacioDescripcion="Aún no hay intentos transversales que coincidan con los filtros."
        onClickFila={(f) => navigate(RUTAS.admin.intentoTransversal(f.intentoId))}
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
