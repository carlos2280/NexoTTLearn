import { cn } from "@/shared/lib/cn"
import type {
  ClaseColorSkill,
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
} from "@nexott-learn/shared-types"
import { ArrowRight, Sparkles } from "lucide-react"

interface PanelContextoProps {
  readonly avance: MeAvanceCursoResponse
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
  readonly seccionActivaId: string | null
  readonly onIrASiguiente: (seccionId: string) => void
}

/**
 * Panel derecho: contexto global del participante en el curso. No es un mero
 * resumen — agrupa lo que el participante necesita para decidir qué hacer
 * después:
 *
 *  - "Skills exigidas" → su nota actual contra cada skill (panorámica).
 *  - "Siguiente sección" sugerida → CTA directo cuando aplica.
 *  - "Transversal / Entrevista IA" → chips de disponibilidad si están listos.
 */
export function PanelContexto({
  avance,
  transversal,
  entrevistaIa,
  seccionActivaId,
  onIrASiguiente,
}: PanelContextoProps) {
  const sugerencia = avance.siguienteSeccion
  const mostrarSugerencia = sugerencia !== null && sugerencia.seccionId !== seccionActivaId

  return (
    <aside className="flex flex-col gap-6 overflow-y-auto border-border border-l bg-surface px-5 py-6">
      <SeccionAvance avance={avance} />
      {mostrarSugerencia ? (
        <SeccionSugerencia
          titulo={sugerencia.titulo}
          onClick={() => onIrASiguiente(sugerencia.seccionId)}
        />
      ) : null}
      <SeccionDisponibilidad transversal={transversal} entrevistaIa={entrevistaIa} />
      {avance.porSkill.length > 0 ? <SeccionSkills avance={avance} /> : null}
    </aside>
  )
}

function SeccionAvance({ avance }: { readonly avance: MeAvanceCursoResponse }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="nx-eyebrow text-text-tertiary">Tu avance</h3>
      <div className="flex items-baseline gap-2">
        <span className="tabular font-mono text-display-md text-text-primary leading-none">
          {avance.porcentajeAvance}
        </span>
        <span className="font-semibold text-h3 text-text-secondary">%</span>
      </div>
      <p className="text-caption text-text-tertiary">
        {avance.seccionesCompletadas} de {avance.seccionesObligatorias} secciones obligatorias
      </p>
    </section>
  )
}

function SeccionSugerencia({
  titulo,
  onClick,
}: { readonly titulo: string; readonly onClick: () => void }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent-soft p-4">
      <h3 className="nx-eyebrow text-accent-on-soft">Siguiente sección</h3>
      <p className="text-body-sm text-text-primary">{titulo}</p>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 self-start text-accent-on-soft text-body-sm hover:underline"
      >
        Ir <ArrowRight className="h-3.5 w-3.5" aria-hidden={true} />
      </button>
    </section>
  )
}

function SeccionDisponibilidad({
  transversal,
  entrevistaIa,
}: {
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
}) {
  const transversalListo = transversal?.disponible === true
  const entrevistaLista = entrevistaIa?.disponible === true

  if (!(transversal || entrevistaIa)) {
    return null
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="nx-eyebrow text-text-tertiary">Cierre del curso</h3>
      <div className="flex flex-col gap-2">
        {transversal ? (
          <ChipDisponibilidad
            etiqueta="Proyecto transversal"
            disponible={transversalListo}
            descripcionLocked="Completa tu plan para desbloquearlo."
          />
        ) : null}
        {entrevistaIa ? (
          <ChipDisponibilidad
            etiqueta="Entrevista IA"
            disponible={entrevistaLista}
            descripcionLocked="Se desbloquea al aprobar el transversal."
          />
        ) : null}
      </div>
    </section>
  )
}

function ChipDisponibilidad({
  etiqueta,
  disponible,
  descripcionLocked,
}: {
  readonly etiqueta: string
  readonly disponible: boolean
  readonly descripcionLocked: string
}) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-3 transition-colors duration-slow ease-default",
        disponible
          ? "border-aurora-violet/30 bg-[rgb(var(--color-aurora-violet-rgb)/0.06)]"
          : "border-border bg-subtle",
      )}
    >
      <div className="relative mt-0.5">
        <Sparkles
          className={cn(
            "h-4 w-4 shrink-0",
            disponible ? "text-aurora-violet" : "text-text-tertiary",
          )}
          aria-hidden={true}
        />
        {disponible ? (
          <span
            aria-hidden={true}
            className="-right-1 -top-1 nx-pulse-dot absolute inline-block h-2 w-2 rounded-pill bg-aurora-cyan text-aurora-cyan"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-body-sm text-text-primary">{etiqueta}</span>
        <span className="text-caption text-text-tertiary">
          {disponible ? "Disponible ahora." : descripcionLocked}
        </span>
      </div>
    </div>
  )
}

const COLOR_CLASE: Record<ClaseColorSkill, string> = {
  verde: "bg-success",
  amarillo: "bg-warning",
  rojo: "bg-danger",
}

function SeccionSkills({ avance }: { readonly avance: MeAvanceCursoResponse }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="nx-eyebrow text-text-tertiary">Skills exigidas</h3>
      <ul className="flex flex-col gap-2">
        {avance.porSkill.map((skill) => (
          <li key={skill.skillId} className="flex items-center gap-3">
            <span
              aria-hidden={true}
              className={cn(
                "inline-block h-2 w-2 shrink-0 rounded-pill",
                COLOR_CLASE[skill.claseColor],
              )}
            />
            <span className="min-w-0 flex-1 truncate font-mono text-caption text-text-secondary">
              {skill.etiqueta}
            </span>
            <span className="tabular shrink-0 font-mono text-caption text-text-primary">
              {skill.notaActual === null ? "—" : skill.notaActual.toFixed(0)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
