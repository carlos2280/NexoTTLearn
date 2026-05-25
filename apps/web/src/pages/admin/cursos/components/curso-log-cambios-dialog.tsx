import { useListarLogCambios } from "@/features/cursos/hooks/use-listar-log-cambios"
import { Badge } from "@/shared/components/ui/badge"
import { Dialog } from "@/shared/components/ui/dialog"
import { Pagination } from "@/shared/components/ui/pagination"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { AccionLogCurso, LogCambioCurso } from "@nexott-learn/shared-types"
import { useState } from "react"

interface CursoLogCambiosDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly cursoId: string
}

function etiquetaAccion(accion: AccionLogCurso): string {
  switch (accion) {
    case "PUBLICACION":
      return "Publicación"
    case "CIERRE":
      return "Cierre"
    case "DESHACER_CIERRE":
      return "Deshacer cierre"
    case "ARCHIVADO":
      return "Archivado"
    case "CAMBIO_AREAS":
      return "Cambio de áreas"
    case "CAMBIO_PESOS":
      return "Cambio de pesos"
    case "CAMBIO_OBJETIVOS":
      return "Cambio de objetivos"
    case "TOGGLE_TRANSVERSAL":
      return "Toggle transversal"
    case "TOGGLE_ENTREVISTA":
      return "Toggle entrevista"
    case "CAMBIO_MODULOS":
      return "Cambio de módulos"
    default:
      return "Otro"
  }
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
}

const PAGE_SIZE = 20

export function CursoLogCambiosDialog({
  abierto,
  onCambiarAbierto,
  cursoId,
}: CursoLogCambiosDialogProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useListarLogCambios(cursoId, { page, pageSize: PAGE_SIZE }, abierto)

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Log de cambios"
      descripcion="Cada mutación deja huella con autor, fecha y motivo."
      ancho="lg"
    >
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
        {isLoading && !data ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : null}
        {data?.data.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">No hay entradas todavía.</p>
        ) : null}
        {data?.data.map((entrada: LogCambioCurso) => (
          <div key={entrada.id} className="flex flex-col gap-1 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tono="acento" conPunto={true}>
                {etiquetaAccion(entrada.accion)}
              </Badge>
              <span className="tabular text-caption text-text-tertiary">
                {fechaCorta(entrada.fecha)}
              </span>
            </div>
            {entrada.motivo ? (
              <p className="text-body-sm text-text-primary">{entrada.motivo}</p>
            ) : null}
            <span className="text-caption text-text-tertiary">
              Autor: <span className="font-mono">{entrada.autorUsuarioId}</span>
            </span>
          </div>
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
