import { cn } from "@/shared/lib/cn"
import type {
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
} from "@nexott-learn/shared-types"
import { CheckCircle2, Lock } from "lucide-react"

type HitoTipo = "transversal" | "entrevistaIa"

interface BloqueHitosSidebarProps {
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
  readonly hitoActivo: HitoTipo | null
  readonly onAbrirHito: (hito: HitoTipo) => void
  /**
   * Curso cerrado. Los hitos se muestran como completados (check verde)
   * y dejan de ser interactivos — son historico, no acciones pendientes.
   */
  readonly soloLectura: boolean
}

/**
 * Bloque "HITOS DE CIERRE" al final del sidebar del plan. Cada hito
 * (Transversal, Entrevista IA) vive como ítem clickeable cuando está
 * disponible. Click activa el canvas especializado del hito SIN cambiar
 * de ruta (decisión cerrada 2026-05-15).
 */
export function BloqueHitosSidebar({
  transversal,
  entrevistaIa,
  hitoActivo,
  onAbrirHito,
  soloLectura,
}: BloqueHitosSidebarProps) {
  if (!(transversal || entrevistaIa)) {
    return null
  }
  return (
    <section
      className="flex flex-col gap-2 border-border border-t pt-5"
      aria-label="Hitos de cierre del curso"
    >
      <h3 className="px-2 font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
        Hitos de cierre
      </h3>
      <ul className="flex flex-col gap-1">
        {transversal ? (
          <ItemHito
            etiqueta="Proyecto transversal"
            disponible={transversal.disponible}
            enCurso={false}
            activo={hitoActivo === "transversal"}
            onClick={() => onAbrirHito("transversal")}
            soloLectura={soloLectura}
          />
        ) : null}
        {entrevistaIa ? (
          <ItemHito
            etiqueta="Entrevista IA"
            disponible={entrevistaIa.disponible}
            enCurso={entrevistaIa.razon === "INTENTO_EN_CURSO"}
            activo={hitoActivo === "entrevistaIa"}
            onClick={() => onAbrirHito("entrevistaIa")}
            soloLectura={soloLectura}
          />
        ) : null}
      </ul>
    </section>
  )
}

interface ItemHitoProps {
  readonly etiqueta: string
  readonly disponible: boolean
  readonly enCurso: boolean
  readonly activo: boolean
  readonly onClick: () => void
  readonly soloLectura: boolean
}

function microcopyHito(soloLectura: boolean, disponible: boolean, enCurso: boolean): string {
  if (soloLectura) {
    return "Completado"
  }
  if (disponible) {
    return "Disponible"
  }
  if (enCurso) {
    return "En curso"
  }
  return "Pendiente"
}

function ItemHito({ etiqueta, disponible, enCurso, activo, onClick, soloLectura }: ItemHitoProps) {
  const accesible = disponible || enCurso
  const interactivo = !soloLectura && accesible
  const microcopy = microcopyHito(soloLectura, disponible, enCurso)
  return (
    <li>
      <button
        type="button"
        onClick={interactivo ? onClick : undefined}
        disabled={!interactivo}
        aria-current={activo ? "true" : undefined}
        className={cn(
          "group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-fast ease-default",
          activo ? "bg-accent-soft text-accent-on-soft" : "",
          interactivo && !activo
            ? "text-text-secondary hover:bg-surface hover:text-text-primary"
            : "",
          interactivo ? "" : "cursor-default text-text-tertiary",
        )}
      >
        <IconoHito accesible={accesible} activo={activo} soloLectura={soloLectura} />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-body-sm",
              activo ? "font-semibold text-text-primary" : "",
              soloLectura ? "text-text-tertiary" : "",
            )}
          >
            {etiqueta}
          </span>
          <span className="block font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
            {microcopy}
          </span>
        </span>
      </button>
    </li>
  )
}

interface IconoHitoProps {
  readonly accesible: boolean
  readonly activo: boolean
  readonly soloLectura: boolean
}

function IconoHito({ accesible, activo, soloLectura }: IconoHitoProps) {
  if (soloLectura) {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden={true} />
  }
  if (accesible) {
    return (
      <span
        aria-hidden={true}
        className={cn(
          "mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-pill bg-aurora-cyan text-aurora-cyan",
          activo ? "" : "nx-pulse-dot",
        )}
        style={{ boxShadow: "0 0 8px 2px rgb(var(--color-aurora-cyan-rgb) / 0.35)" }}
      />
    )
  }
  return <Lock className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
}
