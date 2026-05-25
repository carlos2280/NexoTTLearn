import { Button } from "@/shared/components/ui/button"
import type {
  DisponibilidadEntrevistaIaResponse,
  RazonDisponibilidadEntrevistaIa,
} from "@nexott-learn/shared-types"
import { ArrowRight, Lock } from "lucide-react"

interface VistaBloqueadaEntrevistaIaProps {
  readonly disponibilidad: DisponibilidadEntrevistaIaResponse
  readonly onContinuarIntento?: () => void
}

interface MensajeBloqueo {
  readonly titulo: string
  readonly descripcion: string
  readonly cta?: "continuar" | null
}

const MENSAJES: ReadonlyMap<RazonDisponibilidadEntrevistaIa, MensajeBloqueo> = new Map([
  [
    "DISPONIBLE",
    {
      titulo: "Entrevista disponible",
      descripcion: "Cuando quieras empezar, vuelve al brief.",
    },
  ],
  [
    "PLAN_INCOMPLETO",
    {
      titulo: "Aun no esta disponible",
      descripcion: "Termina tu plan de estudio para desbloquear la entrevista.",
    },
  ],
  [
    "TRANSVERSAL_NO_APROBADO",
    {
      titulo: "Aun no esta disponible",
      descripcion: "Aprueba el proyecto transversal antes de la entrevista.",
    },
  ],
  [
    "FECHA_NO_ALCANZADA",
    {
      titulo: "Aun no esta disponible",
      descripcion: "La entrevista se desbloquea en la fecha que el admin del curso configuro.",
    },
  ],
  [
    "RATE_LIMIT_HORA",
    {
      titulo: "Has llegado al limite por hora",
      descripcion: "Ya hiciste 5 entrevistas esta hora. Puedes hacer otra en un rato.",
    },
  ],
  [
    "INTENTO_EN_CURSO",
    {
      titulo: "Tienes una entrevista en curso",
      descripcion: "Continua la que ya empezaste — se retoma justo donde la dejaste.",
      cta: "continuar",
    },
  ],
  [
    "ENTREVISTA_IA_NO_CONFIGURADA",
    {
      titulo: "Este curso no tiene entrevista",
      descripcion: "El cierre se hace solo con el proyecto transversal.",
    },
  ],
])

const MENSAJE_FALLBACK: MensajeBloqueo = {
  titulo: "Aun no esta disponible",
  descripcion: "Termina tu plan de estudio para desbloquear la entrevista.",
}

/**
 * Vista 5 del hito Entrevista IA (spec 06) — bloqueada por alguna razon.
 * Microcopy fijo en cliente por `razon`: el backend devuelve `motivoBloqueo`
 * pero preferimos copy controlado en cliente para coherencia narrativa.
 *
 * Solo `INTENTO_EN_CURSO` ofrece CTA de continuar; el resto es informativo.
 */
export function VistaBloqueadaEntrevistaIa({
  disponibilidad,
  onContinuarIntento,
}: VistaBloqueadaEntrevistaIaProps) {
  const mensaje = MENSAJES.get(disponibilidad.razon) ?? MENSAJE_FALLBACK
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow inline-flex items-center gap-2 text-text-tertiary">
          <Lock className="h-3.5 w-3.5" aria-hidden={true} />
          Hito de cierre
        </span>
        <h2 className="text-display-md text-text-primary leading-tight">Entrevista IA</h2>
      </header>

      <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <h3 className="font-medium text-body text-text-primary">{mensaje.titulo}</h3>
        <p className="text-body-sm text-text-secondary">{mensaje.descripcion}</p>
        {mensaje.cta === "continuar" && onContinuarIntento ? (
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={onContinuarIntento}>
              Continuar entrevista
              <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden={true} />
            </Button>
          </div>
        ) : null}
      </article>
    </section>
  )
}
