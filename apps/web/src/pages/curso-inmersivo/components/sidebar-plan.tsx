import { cn } from "@/shared/lib/cn"
import type {
  CursoArbolModulo,
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
  ModoCursoParticipante,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"
import { BloqueHitosSidebar } from "./bloque-hitos-sidebar"
import { FooterAtajos } from "./footer-atajos"
import { ModuloGrupo } from "./modulo-grupo"
import { SidebarHeader } from "./sidebar-header"
import { indexarEstadoAvancePorSeccion, indexarPlanPorSeccion } from "./sidebar-plan.helpers"
import { SidebarShell } from "./sidebar-shell"

type HitoTipo = "transversal" | "entrevistaIa"

interface SidebarPlanProps {
  readonly modo: ModoCursoParticipante
  readonly arbol: readonly CursoArbolModulo[]
  readonly plan: PlanResponseParticipante | undefined
  readonly errorPlan: Error | null
  readonly seccionActivaId: string | null
  readonly onSeleccionar: (seccionId: string) => void
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
  readonly hitoActivo: HitoTipo | null
  readonly onAbrirHito: (hito: HitoTipo) => void
  /**
   * Avance del curso. `seccionesEstado` es la fuente de "completada" y del
   * conteo de bloques evaluables en modo VOLUNTARIO (D-AS-1: sin PlanEstudio,
   * el plan llega `undefined`); el asignado sigue leyendo su plan. El contador
   * usa los agregados. Todo sale del mismo calculo que el porcentaje, asi que
   * no pueden contradecirse.
   */
  readonly avance: MeAvanceCursoResponse | undefined
  /**
   * Error al cargar el avance. En modo voluntario el sidebar depende por
   * completo de el: sin avance todas las filas caen a "pendiente", que es
   * indistinguible de "no has hecho nada" — hay que avisarlo, no callarlo.
   */
  readonly errorAvance: Error | null
  /**
   * Curso cerrado. El sidebar deja de ser estado vivo y pasa a historico:
   * todas las secciones con check verde, contador en x/x, sin avance dinamico.
   */
  readonly soloLectura: boolean
  /**
   * Modo focus de la entrevista IA: atenua el sidebar con opacity baja +
   * blur sutil para que el chat tenga foco absoluto. Mantiene el grid intacto.
   */
  readonly atenuado?: boolean
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
  avance,
  errorAvance,
  soloLectura,
  atenuado,
}: SidebarPlanProps) {
  const claseAtenuado = atenuado
    ? "pointer-events-none opacity-15 blur-[2px] transition-[opacity,filter] duration-cinematic ease-default"
    : "transition-[opacity,filter] duration-cinematic ease-default"

  if (modo === "asignado" && !soloLectura && errorPlan && (!plan || plan.items.length === 0)) {
    return (
      <SidebarShell claseAtenuado={claseAtenuado} eyebrow="Plan de estudio">
        <p className="text-body-sm text-danger-on-soft">
          No pudimos cargar el plan. Reintenta en un momento.
        </p>
      </SidebarShell>
    )
  }

  // El voluntario lee su estado del avance: si falló, callar pintaría todo como
  // pendiente y parecería que perdió su progreso.
  if (modo === "voluntario" && !soloLectura && errorAvance && !avance) {
    return (
      <SidebarShell claseAtenuado={claseAtenuado} eyebrow="Contenido">
        <p className="text-body-sm text-danger-on-soft">
          No pudimos cargar tu avance. Reintenta en un momento.
        </p>
      </SidebarShell>
    )
  }

  if (arbol.length === 0) {
    return (
      <SidebarShell claseAtenuado={claseAtenuado} eyebrow="Contenido">
        <p className="text-body-sm text-text-secondary">
          Este curso aún no tiene módulos publicados.
        </p>
      </SidebarShell>
    )
  }

  const planById = indexarPlanPorSeccion(plan)
  const estadoAvanceById = indexarEstadoAvancePorSeccion(avance?.seccionesEstado)
  const totalSecciones = arbol.reduce((acc, modulo) => acc + modulo.secciones.length, 0)

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden border-border border-r bg-subtle",
        claseAtenuado,
      )}
    >
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
        <SidebarHeader
          modo={modo}
          soloLectura={soloLectura}
          plan={plan}
          avance={avance}
          totalSecciones={totalSecciones}
        />
        <nav aria-label="Contenido del curso" className="flex flex-col gap-0.5">
          {arbol.map((modulo) => (
            <ModuloGrupo
              key={modulo.moduloId}
              titulo={modulo.titulo}
              secciones={modulo.secciones}
              planById={planById}
              estadoAvanceById={estadoAvanceById}
              modo={modo}
              seccionActivaId={seccionActivaId}
              onSeleccionar={onSeleccionar}
              soloLectura={soloLectura}
            />
          ))}
        </nav>
      </div>
      {modo !== "preview" ? (
        <BloqueHitosSidebar
          transversal={transversal}
          entrevistaIa={entrevistaIa}
          hitoActivo={hitoActivo}
          onAbrirHito={onAbrirHito}
          soloLectura={soloLectura}
        />
      ) : null}
      <FooterAtajos />
    </aside>
  )
}
