import type { BloqueRuntimeParrafo } from "@nexott-learn/shared-types"
import { Suspense, lazy } from "react"
import { BloqueHeader } from "./bloque-header"
import { BloqueShell } from "./bloque-shell"

const TiptapReader = lazy(() =>
  import("./tiptap-reader").then((mod) => ({ default: mod.TiptapReader })),
)

interface BloqueLecturaViewProps {
  readonly bloque: BloqueRuntimeParrafo
  readonly esActual: boolean
}

export function BloqueLecturaView({ bloque, esActual }: BloqueLecturaViewProps) {
  return (
    <BloqueShell presetKey="PARRAFO" bloqueId={bloque.id} esActual={esActual}>
      <BloqueHeader
        presetKey="PARRAFO"
        titulo={bloque.titulo}
        estado={bloque.estado}
        duracionEstimadaMin={bloque.duracionEstimadaMin}
      />
      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-glass-1" />}>
        <TiptapReader doc={bloque.payload.contenido.doc} />
      </Suspense>
    </BloqueShell>
  )
}
