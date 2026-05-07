import { usePublicarCurso } from "@/features/admin-cursos/hooks/use-editor-curso"
import { ApiError } from "@/shared/api/api-error"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { Button } from "@/shared/ui/primitives/button"
import type { PublicarResponse } from "@nexott-learn/shared-types"
import { ChevronRight, CircleCheck, CircleX, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface PublishDialogProps {
  readonly cursoId: string
  readonly open: boolean
  readonly onClose: () => void
  readonly onPublished: () => void
}

/**
 * Dialog de publicación. Hace POST /publicar al abrirse para descubrir el
 * caso (A_FALTANTES vs B_OK) — el back es la fuente de verdad. Si caso B
 * pero `resumen.todasCumplidas`, el back también pasa el curso a ACTIVO en
 * la misma llamada (es la semántica acordada en MAESTRO §17.2).
 */
export function PublishDialog({ cursoId, open, onClose, onPublished }: PublishDialogProps) {
  const publicar = usePublicarCurso(cursoId)
  const [response, setResponse] = useState<PublicarResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Vivimos las callbacks en refs para que el effect solo dependa de `open`:
  // queremos disparar /publicar exactamente al abrir, no al re-render.
  const mutateRef = useRef(publicar.mutate)
  mutateRef.current = publicar.mutate
  const onPublishedRef = useRef(onPublished)
  onPublishedRef.current = onPublished

  useEffect(() => {
    if (!open) {
      setResponse(null)
      setError(null)
      return
    }
    mutateRef.current(undefined, {
      onSuccess: (resp) => {
        setResponse(resp)
        if (resp.caso === "B_OK") {
          // El back deja el curso ACTIVO. El consumidor refresca tras el cierre.
          setTimeout(() => onPublishedRef.current(), 600)
        }
      },
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : "No se pudo publicar el curso")
      },
    })
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {response?.caso === "A_FALTANTES"
              ? "Aún no se puede publicar"
              : response?.caso === "B_OK"
                ? "Curso publicado"
                : "Verificando…"}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          {publicar.isPending && !response ? <LoadingState /> : null}

          {error ? (
            <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-3 py-2 text-danger text-sm">
              {error}
            </p>
          ) : null}

          {response?.caso === "A_FALTANTES" ? <CasoA response={response} /> : null}
          {response?.caso === "B_OK" ? <CasoB response={response} /> : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {response?.caso === "B_OK" ? "Cerrar" : "Volver al editor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 text-text-secondary">
      <Sparkles className="size-4 animate-pulse text-brand-violet-soft" strokeWidth={1.6} />
      <span className="text-sm">Validando checklist…</span>
    </div>
  )
}

function CasoA({
  response,
}: {
  readonly response: Extract<PublicarResponse, { caso: "A_FALTANTES" }>
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Faltan {response.faltantes.length} requisitos para publicar este curso.
      </p>

      <ul className="flex flex-col gap-2">
        {response.faltantes.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-[var(--radius-md)] border border-warning/30 bg-warning/5 px-3 py-2"
          >
            <CircleX className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-text-primary">{item.label}</p>
              {item.detalle ? (
                <p className="mt-0.5 text-text-muted text-xs">{item.detalle}</p>
              ) : null}
            </div>
            <ChevronRight className="mt-1 size-3.5 shrink-0 text-text-muted" />
          </li>
        ))}
      </ul>

      {response.cumplidos.length > 0 ? (
        <details className="text-text-muted text-xs">
          <summary className="cursor-pointer">Ya cumplidos ({response.cumplidos.length})</summary>
          <ul className="mt-2 flex flex-col gap-1.5 pl-4">
            {response.cumplidos.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <CircleCheck className="size-3.5 text-success" strokeWidth={1.8} />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

function CasoB({ response }: { readonly response: Extract<PublicarResponse, { caso: "B_OK" }> }) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-success/15">
        <CircleCheck className="size-6 text-success" strokeWidth={1.8} />
      </span>
      <div>
        <p className="font-medium text-base text-text-primary">{response.curso.titulo}</p>
        <p className="text-sm text-text-secondary">
          {response.resumen.areas} áreas · {response.resumen.modulos} módulos ·{" "}
          {response.resumen.bloques} bloques
        </p>
      </div>
      <p className="text-text-muted text-xs">
        El curso pasó a ACTIVO. Ya puedes invitar candidatos desde Diagnóstico.
      </p>
    </div>
  )
}
