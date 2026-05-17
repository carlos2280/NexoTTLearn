import { cn } from "@/shared/lib/cn"
import type {
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
} from "@nexott-learn/shared-types"
import { ArrowRight } from "lucide-react"
import { SeccionCaminoHaciaApto } from "./seccion-camino-hacia-apto"
import { SeccionHaciaElCierre } from "./seccion-hacia-el-cierre"

interface PanelContextoProps {
  readonly avance: MeAvanceCursoResponse
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
  readonly seccionActivaId: string | null
  readonly onIrASiguiente: (seccionId: string) => void
  readonly onAbrirHito: (hito: "transversal" | "entrevistaIa") => void
  /**
   * Modo focus de la entrevista IA: atenua el panel derecho para que el chat
   * tenga foco absoluto (V3 de F2 spec 06, completado en F2.5).
   */
  readonly atenuado?: boolean
}

/**
 * Panel derecho del modo inmersivo. Cuatro secciones, en orden:
 *
 *  1. "Tu avance" — frase narrativa sobria. El número de avance grande vive
 *     solo en el topbar (ref 3).
 *  2. "Siguiente sección" — sugerencia opcional cuando aplica.
 *  3. "Camino hacia apto" — vista cualitativa por área, sin skills granulares
 *     ni números crudos (ref 1 + ref 2). El detalle vive en /mi-ficha.
 *  4. "Hacia el cierre" — línea de tiempo vertical con Transversal y
 *     Entrevista IA (ref 4).
 */
export function PanelContexto({
  avance,
  transversal,
  entrevistaIa,
  seccionActivaId,
  onIrASiguiente,
  onAbrirHito,
  atenuado,
}: PanelContextoProps) {
  const sugerencia = avance.siguienteSeccion
  const mostrarSugerencia = sugerencia !== null && sugerencia.seccionId !== seccionActivaId

  return (
    <aside
      className={cn(
        "flex flex-col gap-6 overflow-y-auto border-border border-l bg-surface px-5 py-6",
        "transition-[opacity,filter] duration-cinematic ease-default",
        atenuado ? "pointer-events-none opacity-15 blur-[2px]" : "",
      )}
    >
      <SeccionAvance avance={avance} />
      {mostrarSugerencia ? (
        <SeccionSugerencia
          titulo={sugerencia.titulo}
          onClick={() => onIrASiguiente(sugerencia.seccionId)}
        />
      ) : null}
      <SeccionCaminoHaciaApto camino={avance.caminoHaciaApto} />
      <SeccionHaciaElCierre
        transversal={transversal}
        entrevistaIa={entrevistaIa}
        onAbrirHito={onAbrirHito}
      />
    </aside>
  )
}

function SeccionAvance({ avance }: { readonly avance: MeAvanceCursoResponse }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="nx-eyebrow text-text-tertiary">Tu avance</h3>
      <p className="text-body-sm text-text-primary">
        <span className="tabular font-mono font-semibold">{avance.seccionesCompletadas}</span>
        {" de "}
        <span className="tabular font-mono font-semibold">{avance.seccionesObligatorias}</span>
        {" secciones completadas."}
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
