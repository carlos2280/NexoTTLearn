import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type {
  CaminoHaciaApto,
  MeAvanceCursoResponse,
  MeAvanceSiguienteSeccion,
} from "@nexott-learn/shared-types"
import { ArrowRight, ChevronDown } from "lucide-react"
import { Link } from "react-router-dom"

interface PanelAvanceProps {
  readonly avance: MeAvanceCursoResponse
  readonly seccionActivaId: string | null
  readonly onIrASiguiente: (seccionId: string) => void
  readonly onCerrar: () => void
  /** Modo focus de la entrevista IA: atenúa el panel para que el chat mande. */
  readonly atenuado?: boolean
}

/**
 * Panel inferior del IDE inmerso (patrón VS Code — Problems/Terminal): el
 * "estado del curso" bajo el lienzo, colapsable. Sustituye a la columna derecha
 * siempre-visible. No duplica lo que ya vive en otros sitios: el % está en la
 * statusbar y el conteo de secciones (canónico, del plan) en el sidebar; el
 * cierre/transversal también en el sidebar. Aquí solo la siguiente sección
 * sugerida y una línea cualitativa de "camino hacia apto" (el detalle por área
 * vive en /mi-ficha).
 */
export function PanelAvance({
  avance,
  seccionActivaId,
  onIrASiguiente,
  onCerrar,
  atenuado,
}: PanelAvanceProps) {
  return (
    <section
      className={cn(
        "shrink-0 border-border border-t bg-surface",
        "transition-[opacity,filter] duration-cinematic ease-default",
        atenuado ? "pointer-events-none opacity-15 blur-[2px]" : "",
      )}
    >
      <div className="flex items-center justify-between border-border border-b bg-subtle px-3 py-1.5">
        <span className="font-code text-caption text-text-tertiary tracking-wide">avance</span>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Colapsar panel de avance"
          className="grid h-5 w-5 place-items-center rounded text-text-tertiary transition-colors duration-base ease-default hover:bg-muted hover:text-text-secondary"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden={true} />
        </button>
      </div>
      <div className="flex flex-col gap-1.5 px-4 py-3">
        <LineaSiguiente
          sugerencia={avance.siguienteSeccion}
          seccionActivaId={seccionActivaId}
          onIrASiguiente={onIrASiguiente}
        />
        <LineaCamino camino={avance.caminoHaciaApto} />
      </div>
    </section>
  )
}

function LineaSiguiente({
  sugerencia,
  seccionActivaId,
  onIrASiguiente,
}: {
  readonly sugerencia: MeAvanceSiguienteSeccion | null
  readonly seccionActivaId: string | null
  readonly onIrASiguiente: (seccionId: string) => void
}) {
  if (sugerencia === null) {
    return <p className="text-body-sm text-text-secondary">Estás al día con tu plan.</p>
  }
  if (sugerencia.seccionId === seccionActivaId) {
    return (
      <p className="text-body-sm text-text-secondary">Estás en tu siguiente sección del plan.</p>
    )
  }
  return (
    <p className="text-body-sm text-text-secondary">
      {"Siguiente: "}
      <button
        type="button"
        onClick={() => onIrASiguiente(sugerencia.seccionId)}
        className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
      >
        {sugerencia.titulo}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden={true} />
      </button>
    </p>
  )
}

function LineaCamino({ camino }: { readonly camino: CaminoHaciaApto }) {
  if (camino.porArea.length === 0) {
    return null
  }
  return (
    <p className="text-caption text-text-tertiary">
      {"Camino hacia apto: "}
      {fraseCamino(camino)}{" "}
      <Link
        to={RUTAS.participante.miFicha}
        className="inline-flex items-center gap-1 text-text-secondary transition-colors duration-base ease-default hover:text-accent"
      >
        ver ficha
        <ArrowRight className="h-3 w-3" aria-hidden={true} />
      </Link>
    </p>
  )
}

function fraseCamino(camino: CaminoHaciaApto): string {
  if (camino.estaListo) {
    return "has demostrado todas las capacidades exigidas."
  }
  const n = camino.faltantesParaApto
  if (n <= 2) {
    return `vas bien, te quedan ${n} ${n === 1 ? "capacidad" : "capacidades"} por demostrar.`
  }
  return `te faltan ${n} capacidades por demostrar.`
}
