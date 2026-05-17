import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { CaminoHaciaApto, CaminoHaciaAptoPorArea } from "@nexott-learn/shared-types"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

interface SeccionCaminoHaciaAptoProps {
  readonly camino: CaminoHaciaApto
}

/**
 * "Camino hacia apto" — Refinamiento 2 de pantalla 03.
 *
 * Vista cualitativa SOLO por área. Cero números crudos, cero jerga técnica.
 * Una frase narrativa arriba responde "cuánto me falta", debajo una fila
 * por área del curso con dots de progreso + etiqueta cualitativa.
 *
 * Las skills granulares NO viven aquí — solo en `/mi-ficha` (pantalla 07).
 */
export function SeccionCaminoHaciaApto({ camino }: SeccionCaminoHaciaAptoProps) {
  if (camino.porArea.length === 0) {
    return null
  }
  return (
    <section className="flex flex-col gap-3">
      <h3 className="nx-eyebrow text-text-tertiary">Camino hacia apto</h3>
      <p className="text-body-sm text-text-primary">{fraseNarrativa(camino)}</p>
      <ul className="flex flex-col gap-2.5">
        {camino.porArea.map((area) => (
          <FilaArea key={area.areaId} area={area} />
        ))}
      </ul>
      <Link
        to={RUTAS.participante.miFicha}
        className="flex items-center gap-1 self-start text-body-sm text-text-secondary transition-colors duration-base ease-default hover:text-accent"
      >
        Ver detalle en mi ficha
        <ArrowRight className="h-3.5 w-3.5" aria-hidden={true} />
      </Link>
    </section>
  )
}

function fraseNarrativa(camino: CaminoHaciaApto): string {
  if (camino.estaListo) {
    return "Has demostrado todas las capacidades exigidas."
  }
  const n = camino.faltantesParaApto
  if (n <= 2) {
    return `Vas bien. Te quedan ${n} ${n === 1 ? "capacidad" : "capacidades"} por demostrar.`
  }
  return `Te faltan ${n} capacidades por demostrar.`
}

const DOTS_TOTAL = 5

function FilaArea({ area }: { readonly area: CaminoHaciaAptoPorArea }) {
  const llenos =
    area.skillsExigidas === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            DOTS_TOTAL,
            Math.round((area.skillsDemostradas / area.skillsExigidas) * DOTS_TOTAL),
          ),
        )
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_50px_96px] items-center gap-3">
      <span
        className="truncate text-body-sm"
        style={{ color: `var(--color-area-${area.areaCodigo}-on-soft)` }}
      >
        {area.areaNombre}
      </span>
      <Dots llenos={llenos} areaCodigo={area.areaCodigo} />
      <EtiquetaCualitativa nivel={area.nivelCualitativo} />
    </li>
  )
}

function Dots({ llenos, areaCodigo }: { readonly llenos: number; readonly areaCodigo: string }) {
  return (
    <span aria-hidden={true} className="flex items-center justify-end gap-1">
      {Array.from({ length: DOTS_TOTAL }, (_unused, i) => {
        const lleno = i < llenos
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: dots posicionales sin id, el índice es estable
            key={i}
            className={cn("inline-block h-1.5 w-1.5 rounded-pill", lleno ? "" : "bg-border")}
            style={lleno ? { backgroundColor: `var(--color-area-${areaCodigo})` } : undefined}
          />
        )
      })}
    </span>
  )
}

const NIVEL_ETIQUETA: Record<CaminoHaciaAptoPorArea["nivelCualitativo"], string> = {
  solido: "sólido",
  enDesarrollo: "en desarrollo",
  porExplorar: "por explorar",
}

function EtiquetaCualitativa({
  nivel,
}: {
  readonly nivel: CaminoHaciaAptoPorArea["nivelCualitativo"]
}) {
  return (
    <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
      {NIVEL_ETIQUETA[nivel]}
    </span>
  )
}
