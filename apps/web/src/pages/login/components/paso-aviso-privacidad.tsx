import { aceptarAvisoPrivacidad } from "@/features/auth/api/aceptar-aviso-privacidad.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { AVISO_VIGENTE_VERSION } from "@nexott-learn/shared-types"
import { useMutation } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"

const VERSION_AVISO = AVISO_VIGENTE_VERSION

interface PasoAvisoPrivacidadProps {
  readonly onExito: () => Promise<void> | void
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 80,
    damping: 18,
    mass: 0.6,
    delay: 0.3 + i * 0.08,
  },
})

export function PasoAvisoPrivacidad({ onExito }: PasoAvisoPrivacidadProps) {
  const reducedMotion = useReducedMotion()
  const mutation = useMutation({
    mutationFn: aceptarAvisoPrivacidad,
    onSuccess: async () => {
      await onExito()
    },
  })

  const apiError = mutation.error instanceof ApiError ? mutation.error : null
  const motionProps = (i: number) => (reducedMotion ? {} : stagger(i))

  async function handleAceptar(): Promise<void> {
    await mutation.mutateAsync({ versionAviso: VERSION_AVISO }).catch(() => undefined)
  }

  return (
    <div className="flex flex-col gap-5">
      <motion.header {...motionProps(0)} className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-aurora-violet">Aviso · {VERSION_AVISO}</span>
        <h1 className="text-h1 text-text-primary">
          Cómo tratamos tu ficha<span className="text-aurora-violet">.</span>
        </h1>
        <p className="text-body-sm text-text-secondary">
          Tu desempeño y skills viven contigo. Lee y confirma antes de seguir.
        </p>
      </motion.header>

      {apiError ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Banner tone="danger">{apiError.message}</Banner>
        </motion.div>
      ) : null}

      <motion.div {...motionProps(1)} className="relative">
        {/* Fade superior — avisa que hay más arriba al scrollear */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 rounded-t-xl bg-[image:linear-gradient(to_bottom,rgb(var(--color-aurora-violet-rgb)/0.04),transparent)]"
        />
        {/* Fade inferior — el patrón "hay más para leer" */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 rounded-b-xl bg-[image:linear-gradient(to_top,var(--color-subtle),transparent)]"
        />

        <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border bg-subtle px-5 py-5">
          <div className="flex flex-col gap-3.5 text-body-sm text-text-secondary">
            <p>
              <strong className="font-medium text-aurora-violet">
                Tratamiento de datos personales.
              </strong>{" "}
              NexoTT Learn procesa información sobre tu desempeño formativo — evaluaciones,
              intentos, plan personal — con la finalidad exclusiva de prepararte para entrevistas
              con clientes de la consultora.
            </p>
            <p>
              <strong className="font-medium text-aurora-violet">Tu ficha de skills</strong> es
              interna y nunca se comparte con clientes externos. Solo administradores autorizados
              acceden a tu detalle. Los reportes históricos conservan tus notas y trazabilidad de
              cada cambio.
            </p>
            <p>
              <strong className="font-medium text-aurora-violet">Tus derechos:</strong> solicitar
              exportación de tu ficha, solicitar anonimización en caso de baja, conocer quién
              consultó tu detalle y cuándo. Estas solicitudes se canalizan a través del
              administrador del sistema.
            </p>
            <p>
              <strong className="font-medium text-aurora-violet">Al aceptar,</strong> dejas
              constancia de la lectura y conformidad con esta versión del aviso. Si el aviso cambia,
              se te volverá a pedir aceptación.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div {...motionProps(2)} className="pt-1">
        <Button
          type="button"
          fullWidth={true}
          onClick={handleAceptar}
          isLoading={mutation.isPending}
        >
          Acepto y continúo
        </Button>
      </motion.div>
    </div>
  )
}
