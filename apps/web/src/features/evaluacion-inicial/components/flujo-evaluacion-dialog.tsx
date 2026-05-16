import { Dialog } from "@/shared/components/ui/dialog"
import type { PreviewResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"
import { FlujoPasoDescargar } from "./flujo-paso-descargar"
import { FlujoPasoPreview } from "./flujo-paso-preview"
import { FlujoPasoSubir } from "./flujo-paso-subir"

type Paso = "descargar" | "subir" | "preview"

interface FlujoEvaluacionDialogProps {
  readonly abierto: boolean
  readonly cursoId: string
  readonly nombreCurso: string
  readonly onCerrar: () => void
}

const DESCRIPCION_POR_PASO: Record<Paso, string> = {
  descargar: "Paso 1 de 3 — Descargar template",
  subir: "Paso 2 de 3 — Subir Excel relleno",
  preview: "Paso 3 de 3 — Revisar y aplicar",
}

export function FlujoEvaluacionDialog({
  abierto,
  cursoId,
  nombreCurso,
  onCerrar,
}: FlujoEvaluacionDialogProps) {
  const [paso, setPaso] = useState<Paso>("descargar")
  const [preview, setPreview] = useState<PreviewResponse | null>(null)

  function reiniciar(): void {
    setPaso("descargar")
    setPreview(null)
  }

  function manejarCambioAbierto(siguiente: boolean): void {
    if (!siguiente) {
      reiniciar()
      onCerrar()
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={manejarCambioAbierto}
      titulo={`Evaluación inicial · ${nombreCurso}`}
      descripcion={DESCRIPCION_POR_PASO[paso]}
      ancho="lg"
    >
      {paso === "descargar" ? (
        <FlujoPasoDescargar
          cursoId={cursoId}
          nombreCurso={nombreCurso}
          onContinuar={() => setPaso("subir")}
        />
      ) : null}

      {paso === "subir" ? (
        <FlujoPasoSubir
          cursoId={cursoId}
          onPreview={(p) => {
            setPreview(p)
            setPaso("preview")
          }}
          onAtras={() => setPaso("descargar")}
        />
      ) : null}

      {paso === "preview" && preview ? (
        <FlujoPasoPreview
          cursoId={cursoId}
          preview={preview}
          onAplicado={({ skillsActualizadas }) => {
            toast.success(`Carga aplicada · ${skillsActualizadas} cambio(s)`)
            reiniciar()
            onCerrar()
          }}
          onDescartado={() => {
            toast.success("Preview descartado")
            reiniciar()
            onCerrar()
          }}
        />
      ) : null}
    </Dialog>
  )
}
