import { aceptarAvisoPrivacidad } from "@/features/auth/api/aceptar-aviso-privacidad.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { AVISO_VIGENTE_VERSION } from "@nexott-learn/shared-types"
import { useMutation } from "@tanstack/react-query"

const VERSION_AVISO = AVISO_VIGENTE_VERSION

interface PasoAvisoPrivacidadProps {
  readonly onExito: () => Promise<void> | void
}

export function PasoAvisoPrivacidad({ onExito }: PasoAvisoPrivacidadProps) {
  const mutation = useMutation({
    mutationFn: aceptarAvisoPrivacidad,
    onSuccess: async () => {
      await onExito()
    },
  })

  const apiError = mutation.error instanceof ApiError ? mutation.error : null

  async function handleAceptar(): Promise<void> {
    await mutation.mutateAsync({ versionAviso: VERSION_AVISO }).catch(() => undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <p className="nx-eyebrow text-text-tertiary">Aviso · {VERSION_AVISO}</p>
        <h1 className="text-h3 text-text-primary">Cómo tratamos tu ficha</h1>
        <p className="text-body-sm text-text-secondary">
          Tu desempeño y skills viven contigo. Lee y confirma antes de seguir.
        </p>
      </header>

      {apiError ? <Banner tone="danger">{apiError.message}</Banner> : null}

      <div className="max-h-[260px] overflow-y-auto rounded-md border border-border bg-subtle p-4">
        <div className="flex flex-col gap-3 text-body-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">Tratamiento de datos personales.</strong> NexoTT
            Learn procesa información sobre tu desempeño formativo — evaluaciones, intentos, plan
            personal — con la finalidad exclusiva de prepararte para entrevistas con clientes de la
            consultora.
          </p>
          <p>
            Tu ficha de skills es interna y nunca se comparte con clientes externos. Solo
            administradores autorizados acceden a tu detalle. Los reportes históricos conservan tus
            notas y trazabilidad de cada cambio.
          </p>
          <p>
            Tus derechos: solicitar exportación de tu ficha, solicitar anonimización en caso de
            baja, conocer quién consultó tu detalle y cuándo. Estas solicitudes se canalizan a
            través del administrador del sistema.
          </p>
          <p>
            Al aceptar, dejas constancia de la lectura y conformidad con esta versión del aviso. Si
            el aviso cambia, se te volverá a pedir aceptación.
          </p>
        </div>
      </div>

      <Button type="button" fullWidth={true} onClick={handleAceptar} isLoading={mutation.isPending}>
        Acepto y continúo
      </Button>
    </div>
  )
}
