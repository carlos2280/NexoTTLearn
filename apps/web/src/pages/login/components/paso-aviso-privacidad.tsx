import { aceptarAvisoPrivacidad } from "@/features/auth/api/aceptar-aviso-privacidad.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { useMutation } from "@tanstack/react-query"

const VERSION_AVISO = "v1.0"

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
        <h1 className="font-semibold text-[20px] text-[var(--color-text-primary)] leading-7">
          Aviso de privacidad
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-5">
          Antes de continuar, lee y acepta el aviso ({VERSION_AVISO}).
        </p>
      </header>

      {apiError ? <Banner tone="danger">{apiError.message}</Banner> : null}

      <div className="max-h-[260px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-subtle)] p-4">
        <div className="flex flex-col gap-3 text-[13px] text-[var(--color-text-secondary)] leading-5">
          <p>
            <strong className="text-[var(--color-text-primary)]">
              Tratamiento de datos personales.
            </strong>{" "}
            NexoTT Learn procesa información sobre tu desempeño formativo — evaluaciones, intentos,
            plan personal — con la finalidad exclusiva de prepararte para entrevistas con clientes
            de la consultora.
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
