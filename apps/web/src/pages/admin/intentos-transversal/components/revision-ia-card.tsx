import { Button } from "@/shared/components/ui/button"
import type { IntentoTransversalAdminResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { DialogCapaCualitativa } from "./dialog-capa-cualitativa"
import { InformeRevisionIa } from "./informe-revision-ia"

interface RevisionIaCardProps {
  readonly intento: IntentoTransversalAdminResponse
}

/**
 * Sección central del admin: el informe de la "Revisión con IA" (capa única).
 * Solo lectura. Si la IA aún no cargó (job corriendo o fallido), muestra un
 * estado vacío + un escape para cargar la nota manualmente y no dejar el
 * intento bloqueado.
 */
export function RevisionIaCard({ intento }: RevisionIaCardProps) {
  const [cargarAbierto, setCargarAbierto] = useState(false)
  const editable = intento.estado === "EN_EVALUACION" || intento.estado === "EVALUADO"
  const sinRevision = intento.revisionIa === null

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Revisión con IA</span>
          <h2 className="text-h3 text-text-primary">Informe del proyecto</h2>
        </div>
        {sinRevision && editable ? (
          <Button variant="secondary" size="sm" onClick={() => setCargarAbierto(true)}>
            Cargar manualmente
          </Button>
        ) : null}
      </div>

      {intento.revisionIa === null ? (
        <p className="text-body-sm text-text-secondary">
          {editable
            ? "La revisión con IA todavía no está disponible. Si el intento sigue en evaluación, espera a que termine; si la evaluación falló, puedes cargarla manualmente."
            : "Este intento se cerró sin una revisión con IA registrada."}
        </p>
      ) : (
        <InformeRevisionIa
          revision={intento.revisionIa}
          nota={intento.notaCapaCualitativa}
          umbral={intento.transversal.umbralAprobacion}
        />
      )}

      <DialogCapaCualitativa
        abierto={cargarAbierto}
        onCambiarAbierto={setCargarAbierto}
        intentoId={intento.intentoId}
        notaActual={intento.notaCapaCualitativa}
      />
    </section>
  )
}
