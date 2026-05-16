import { Dialog } from "@/shared/components/ui/dialog"
import { Pagination } from "@/shared/components/ui/pagination"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { CargaEvaluacionInicialResumen } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useHistorialEvaluacion } from "../hooks/use-historial-evaluacion"

interface HistorialEvaluacionDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly cursoId: string
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
}

const PAGE_SIZE = 10

export function HistorialEvaluacionDialog({
  abierto,
  onCambiarAbierto,
  cursoId,
}: HistorialEvaluacionDialogProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useHistorialEvaluacion(cursoId, page, PAGE_SIZE, abierto)

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Historial de cargas"
      descripcion="Cada carga aplicada queda registrada con autor y archivo origen."
      ancho="lg"
    >
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
        {isLoading && !data ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : null}

        {data?.data.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">Aún no hay cargas aplicadas.</p>
        ) : null}

        {data?.data.map((c: CargaEvaluacionInicialResumen) => (
          <article
            key={c.cargaId}
            className="flex flex-col gap-1 rounded-md border border-border p-3"
          >
            <header className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-body-sm text-text-primary">
                {c.nombreOriginal ?? "Sin nombre"}
              </span>
              <span className="tabular text-caption text-text-tertiary">
                {fechaCorta(c.aplicadoEn)}
              </span>
            </header>
            <div className="flex flex-wrap items-center gap-4 text-caption text-text-tertiary">
              <span>Autor: {c.aplicadoPor.nombre}</span>
              <span>
                <span className="tabular text-text-primary">{c.colaboradoresActualizados}</span>{" "}
                persona(s)
              </span>
              <span>
                <span className="tabular text-text-primary">{c.skillsActualizadas}</span> skill(s)
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-3">
        <Pagination
          page={data?.meta.page ?? page}
          pageSize={data?.meta.pageSize ?? PAGE_SIZE}
          total={data?.meta.total ?? 0}
          onCambiarPage={setPage}
        />
      </div>
    </Dialog>
  )
}
