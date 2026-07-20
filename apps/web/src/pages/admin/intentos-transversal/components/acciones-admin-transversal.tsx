import { useAnularIntentoTransversal } from "@/features/transversal/hooks/use-anular-intento-transversal"
import { useFinalizarIntentoTransversal } from "@/features/transversal/hooks/use-finalizar-intento-transversal"
import { Button } from "@/shared/components/ui/button"
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import type {
  EstadoIntentoTransversal,
  IntentoTransversalAdminResponse,
} from "@nexott-learn/shared-types"
import { useState } from "react"
import { GestionIntentosExtra } from "./gestion-intentos-extra"

interface AccionesAdminTransversalProps {
  readonly intento: IntentoTransversalAdminResponse
}

const COPY_REPO_INACCESIBLE = "El repositorio no se pudo abrir; el alumno debe reenviar"

function copyFinalizar(estado: EstadoIntentoTransversal, revisionCargada: boolean): string {
  if (estado === "FINALIZADO") {
    return "El intento ya está finalizado"
  }
  if (estado === "ANULADO") {
    return "Intento anulado"
  }
  if (estado === "FALLO_ACCESO_REPO") {
    return COPY_REPO_INACCESIBLE
  }
  if (!revisionCargada) {
    return "Falta la revisión con IA"
  }
  return ""
}

/**
 * Acciones admin del intento transversal: Finalizar (deshabilitado hasta que la
 * revisión con IA tenga nota) y Anular (con motivo). Tras éxito ambas mutations
 * invalidan la query del intento + listas dependientes.
 */
export function AccionesAdminTransversal({ intento }: AccionesAdminTransversalProps) {
  const [finalizarAbierto, setFinalizarAbierto] = useState(false)
  const [anularAbierto, setAnularAbierto] = useState(false)
  const finalizarMutation = useFinalizarIntentoTransversal()
  const anularMutation = useAnularIntentoTransversal()

  const revisionCargada = intento.notaCapaCualitativa !== null
  const editable = intento.estado === "EN_EVALUACION" || intento.estado === "EVALUADO"
  const puedeFinalizar = editable && revisionCargada
  const tooltipFinalizar = copyFinalizar(intento.estado, revisionCargada)
  const tooltipAnular =
    intento.estado === "FALLO_ACCESO_REPO"
      ? COPY_REPO_INACCESIBLE
      : "El intento ya está finalizado o anulado"

  async function confirmarFinalizar() {
    await finalizarMutation.mutateAsync({ intentoId: intento.intentoId })
    setFinalizarAbierto(false)
  }
  async function confirmarAnular(motivo: string) {
    await anularMutation.mutateAsync({ intentoId: intento.intentoId, motivo })
    setAnularAbierto(false)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Acciones</span>
        <h2 className="text-h3 text-text-primary">Finalizar o anular</h2>
        <p className="text-body-sm text-text-secondary">
          Al finalizar se calcula la nota global desde la revisión con IA y se actualizan las skills
          del colaborador. Anular deja el intento sin efecto en las skills.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setFinalizarAbierto(true)}
          disabled={!puedeFinalizar}
          title={puedeFinalizar ? undefined : tooltipFinalizar}
        >
          Finalizar evaluación
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAnularAbierto(true)}
          disabled={!editable}
          title={editable ? undefined : tooltipAnular}
        >
          Anular intento
        </Button>
      </div>

      {intento.cupoIntentos ? <GestionIntentosExtra cupo={intento.cupoIntentos} /> : null}

      <ConfirmDialog
        abierto={finalizarAbierto}
        onCambiarAbierto={setFinalizarAbierto}
        titulo="Finalizar evaluación"
        descripcion="Se calculará la nota global y se actualizarán las skills del colaborador. La acción no se puede deshacer."
        textoConfirmar="Finalizar y calcular"
        variante="primary"
        enviando={finalizarMutation.isPending}
        onConfirmar={confirmarFinalizar}
      />
      <ConfirmMotivoDialog
        abierto={anularAbierto}
        onCambiarAbierto={setAnularAbierto}
        titulo="Anular intento"
        descripcion="El intento dejará de contar para las skills del colaborador. La acción no se puede deshacer."
        textoConfirmar="Anular intento"
        variante="danger"
        enviando={anularMutation.isPending}
        onConfirmar={confirmarAnular}
      />
    </section>
  )
}
