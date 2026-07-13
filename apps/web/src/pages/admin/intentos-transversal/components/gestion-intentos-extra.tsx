import { useDarIntentoExtra } from "@/features/transversal/hooks/use-dar-intento-extra"
import { Button } from "@/shared/components/ui/button"
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog"
import type { CupoIntentosTransversal } from "@nexott-learn/shared-types"
import { useState } from "react"

interface GestionIntentosExtraProps {
  readonly cupo: CupoIntentosTransversal
}

function copyDisponibles(restantes: number): string {
  if (restantes <= 0) {
    return "sin intentos disponibles"
  }
  return restantes === 1 ? "1 disponible" : `${restantes} disponibles`
}

/**
 * Bloque "Intentos" de la tarjeta de acciones (Fase 4b ②). Muestra el cupo
 * consumido de la asignación y permite otorgar +1 intento del transversal. El
 * botón está siempre disponible (decisión de producto): el admin manda.
 */
export function GestionIntentosExtra({ cupo }: GestionIntentosExtraProps) {
  const [abierto, setAbierto] = useState(false)
  const darIntentoExtra = useDarIntentoExtra()
  const restantes = cupo.intentosCupo - cupo.intentosUsados

  async function confirmar() {
    await darIntentoExtra.mutateAsync({ asignacionId: cupo.asignacionId })
    setAbierto(false)
  }

  return (
    <div className="flex flex-col gap-3 border-border border-t pt-4">
      <div className="flex flex-col gap-0.5">
        <span className="nx-eyebrow text-text-tertiary">Intentos</span>
        <p className="text-body-sm text-text-secondary">
          <span className="tabular text-text-primary">
            Usó {cupo.intentosUsados} de {cupo.intentosCupo}
          </span>{" "}
          · {copyDisponibles(restantes)}
        </p>
      </div>
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setAbierto(true)}>
        Dar 1 intento más
      </Button>

      <ConfirmDialog
        abierto={abierto}
        onCambiarAbierto={setAbierto}
        titulo="Dar un intento más"
        descripcion="El colaborador podrá enviar un nuevo intento del proyecto transversal. Suma 1 al cupo de esta asignación."
        textoConfirmar="Dar 1 intento"
        variante="primary"
        enviando={darIntentoExtra.isPending}
        onConfirmar={confirmar}
      />
    </div>
  )
}
