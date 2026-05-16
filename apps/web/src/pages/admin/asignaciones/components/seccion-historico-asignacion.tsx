import { useHistoricoAsignacion } from "@/features/asignaciones/hooks/use-historico-asignacion"
import { Pagination } from "@/shared/components/ui/pagination"
import { SidePeekSeccion } from "@/shared/components/ui/side-peek"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { AsignacionHistoricoEntrada } from "@nexott-learn/shared-types"
import { useState } from "react"

const PAGE_SIZE = 10
const SEPARADOR_REGEX = /_/g

function formatearFechaHora(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function etiquetaEstado(estado: string): string {
  return estado.replace(SEPARADOR_REGEX, " ").toLowerCase()
}

function ItemHistorico({ entrada }: { readonly entrada: AsignacionHistoricoEntrada }) {
  return (
    <li className="relative border-border border-l-2 pb-4 pl-4 last:pb-0">
      <span className="-left-[5px] absolute top-1.5 h-2 w-2 rounded-pill bg-accent" />
      <div className="flex flex-col gap-1">
        <p className="text-body-sm text-text-primary">
          <span className="text-text-tertiary">{etiquetaEstado(entrada.estadoAnterior)}</span>
          <span className="mx-1.5 text-text-tertiary">→</span>
          <span className="font-medium">{etiquetaEstado(entrada.estadoNuevo)}</span>
        </p>
        <span className="tabular text-caption text-text-tertiary">
          {formatearFechaHora(entrada.fecha)}
        </span>
        {entrada.motivo ? (
          <p className="text-body-sm text-text-secondary">{entrada.motivo}</p>
        ) : null}
      </div>
    </li>
  )
}

interface Props {
  readonly asignacionId: string | undefined
}

export function SeccionHistoricoAsignacion({ asignacionId }: Props) {
  const [page, setPage] = useState(1)
  const query = useHistoricoAsignacion(asignacionId, { page, pageSize: PAGE_SIZE })
  const entradas = query.data?.data ?? []

  return (
    <SidePeekSeccion titulo="Histórico de estados">
      {query.isLoading && !query.data ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : entradas.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">Sin cambios registrados todavía.</p>
      ) : (
        <ol className="flex flex-col gap-0">
          {entradas.map((e) => (
            <ItemHistorico key={`${e.fecha}-${e.estadoNuevo}`} entrada={e} />
          ))}
        </ol>
      )}
      {(query.data?.meta.total ?? 0) > PAGE_SIZE ? (
        <Pagination
          page={query.data?.meta.page ?? page}
          pageSize={query.data?.meta.pageSize ?? PAGE_SIZE}
          total={query.data?.meta.total ?? 0}
          onCambiarPage={setPage}
        />
      ) : null}
    </SidePeekSeccion>
  )
}
