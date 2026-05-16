import { Kbd } from "@/shared/components/ui/kbd"
import { cn } from "@/shared/lib/cn"
import type {
  CursoArbolModulo,
  CursoArbolSeccion,
  ModoCursoParticipante,
  PlanResponseParticipante,
  SeccionPlanItemParticipante,
} from "@nexott-learn/shared-types"
import { CheckCircle2, Circle, CircleDashed } from "lucide-react"
import type {
  DisponibilidadEntrevistaIaConMotivo,
  DisponibilidadTransversalConMotivo,
} from "../types"
import { BloqueHitosSidebar } from "./bloque-hitos-sidebar"

type HitoTipo = "transversal" | "entrevistaIa"

interface SidebarPlanProps {
  readonly modo: ModoCursoParticipante
  readonly arbol: readonly CursoArbolModulo[]
  readonly plan: PlanResponseParticipante | undefined
  readonly errorPlan: Error | null
  readonly seccionActivaId: string | null
  readonly onSeleccionar: (seccionId: string) => void
  readonly transversal: DisponibilidadTransversalConMotivo | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaConMotivo | undefined
  readonly hitoActivo: HitoTipo | null
  readonly onAbrirHito: (hito: HitoTipo) => void
}

/**
 * Sidebar de navegacion del curso inmersivo. La fuente del arbol es siempre
 * `arbol` (modulos + secciones del catalogo). En modo `asignado` el `plan`
 * personal anota cada seccion con `caracter` (obligatoria/opcional) y
 * `completada` para pintar estado. En `voluntario`/`preview` no hay plan: el
 * sidebar es un indice limpio.
 */
export function SidebarPlan({
  modo,
  arbol,
  plan,
  errorPlan,
  seccionActivaId,
  onSeleccionar,
  transversal,
  entrevistaIa,
  hitoActivo,
  onAbrirHito,
}: SidebarPlanProps) {
  if (modo === "asignado" && errorPlan && (!plan || plan.items.length === 0)) {
    return (
      <aside className="flex flex-col gap-3 overflow-y-auto border-border border-r bg-subtle p-5">
        <h2 className="nx-eyebrow text-text-tertiary">Plan de estudio</h2>
        <p className="text-body-sm text-danger-on-soft">
          No pudimos cargar el plan. Reintenta en un momento.
        </p>
      </aside>
    )
  }

  if (arbol.length === 0) {
    return (
      <aside className="flex flex-col gap-3 overflow-y-auto border-border border-r bg-subtle p-5">
        <h2 className="nx-eyebrow text-text-tertiary">Contenido</h2>
        <p className="text-body-sm text-text-secondary">
          Este curso aún no tiene módulos publicados.
        </p>
      </aside>
    )
  }

  const planById = indexarPlanPorSeccion(plan)

  return (
    <aside className="flex flex-col overflow-hidden border-border border-r bg-subtle">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
        <header className="flex items-baseline justify-between gap-2">
          <h2 className="nx-eyebrow text-text-tertiary">{eyebrowSidebar(modo)}</h2>
          {modo === "asignado" && plan ? (
            <span className="font-mono text-caption text-text-tertiary">
              {plan.avance.seccionesCompletadas}/{plan.avance.seccionesObligatorias}
            </span>
          ) : null}
        </header>
        <nav aria-label="Contenido del curso" className="flex flex-col gap-5">
          {arbol.map((modulo) => (
            <ModuloGrupo
              key={modulo.moduloId}
              titulo={modulo.titulo}
              secciones={modulo.secciones}
              planById={planById}
              modo={modo}
              seccionActivaId={seccionActivaId}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </nav>
        {modo !== "preview" ? (
          <BloqueHitosSidebar
            transversal={transversal}
            entrevistaIa={entrevistaIa}
            hitoActivo={hitoActivo}
            onAbrirHito={onAbrirHito}
          />
        ) : null}
      </div>
      <FooterAtajos />
    </aside>
  )
}

function eyebrowSidebar(modo: ModoCursoParticipante): string {
  if (modo === "asignado") {
    return "Plan de estudio"
  }
  if (modo === "voluntario") {
    return "Contenido"
  }
  return "Vista previa"
}

function indexarPlanPorSeccion(
  plan: PlanResponseParticipante | undefined,
): ReadonlyMap<string, SeccionPlanItemParticipante> {
  const map = new Map<string, SeccionPlanItemParticipante>()
  if (!plan) {
    return map
  }
  for (const modulo of plan.items) {
    for (const seccion of modulo.secciones) {
      map.set(seccion.seccionId, seccion)
    }
  }
  return map
}

function FooterAtajos() {
  return (
    <footer className="flex items-center justify-between gap-2 border-border border-t bg-canvas/40 px-5 py-3">
      <div className="flex items-center gap-2">
        <Kbd>[</Kbd>
        <Kbd>]</Kbd>
        <span className="text-caption text-text-tertiary">navegar</span>
      </div>
      <div className="flex items-center gap-2">
        <Kbd>Esc</Kbd>
        <span className="text-caption text-text-tertiary">salir</span>
      </div>
    </footer>
  )
}

interface ModuloGrupoProps {
  readonly titulo: string
  readonly secciones: readonly CursoArbolSeccion[]
  readonly planById: ReadonlyMap<string, SeccionPlanItemParticipante>
  readonly modo: ModoCursoParticipante
  readonly seccionActivaId: string | null
  readonly onSeleccionar: (seccionId: string) => void
}

function ModuloGrupo({
  titulo,
  secciones,
  planById,
  modo,
  seccionActivaId,
  onSeleccionar,
}: ModuloGrupoProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-2 font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
        {titulo}
      </h3>
      <ul className="flex flex-col gap-1">
        {secciones.map((seccion) => {
          const plan = planById.get(seccion.seccionId) ?? null
          return (
            <FilaSeccion
              key={seccion.seccionId}
              titulo={seccion.titulo}
              seccionId={seccion.seccionId}
              modo={modo}
              plan={plan}
              activa={seccion.seccionId === seccionActivaId}
              onSeleccionar={onSeleccionar}
            />
          )
        })}
      </ul>
    </section>
  )
}

interface FilaSeccionProps {
  readonly titulo: string
  readonly seccionId: string
  readonly modo: ModoCursoParticipante
  readonly plan: SeccionPlanItemParticipante | null
  readonly activa: boolean
  readonly onSeleccionar: (seccionId: string) => void
}

function FilaSeccion({ titulo, seccionId, modo, plan, activa, onSeleccionar }: FilaSeccionProps) {
  const completada = plan?.completada ?? false
  const esOpcional = plan?.caracter === "OPCIONAL"
  return (
    <li>
      <button
        type="button"
        onClick={() => onSeleccionar(seccionId)}
        aria-current={activa ? "true" : undefined}
        className={cn(
          "group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-fast ease-default",
          activa
            ? "bg-accent-soft text-accent-on-soft"
            : "text-text-secondary hover:bg-surface hover:text-text-primary",
        )}
      >
        <IconoEstado completada={completada} esOpcional={esOpcional} activa={activa} modo={modo} />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-body-sm",
              activa ? "font-semibold text-text-primary" : "",
              completada && !activa ? "text-text-tertiary" : "",
            )}
          >
            {titulo}
          </span>
          {esOpcional && !completada ? (
            <span className="block font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
              opcional
            </span>
          ) : null}
        </span>
      </button>
    </li>
  )
}

interface IconoEstadoProps {
  readonly completada: boolean
  readonly esOpcional: boolean
  readonly activa: boolean
  readonly modo: ModoCursoParticipante
}

function IconoEstado({ completada, esOpcional, activa, modo }: IconoEstadoProps) {
  if (completada) {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden={true} />
  }
  if (activa) {
    return (
      <span
        aria-hidden={true}
        className="mt-1 inline-block h-3 w-3 shrink-0 rounded-pill bg-accent"
      />
    )
  }
  if (esOpcional && modo === "asignado") {
    return (
      <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
    )
  }
  return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
}
