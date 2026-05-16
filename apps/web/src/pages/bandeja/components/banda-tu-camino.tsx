import { RUTAS } from "@/shared/constants/rutas"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import type { FichaResumenResponse, FichaResumenTopArea, NivelCualitativoArea } from "../types"

interface BandaTuCaminoProps {
  readonly resumen: FichaResumenResponse | null
  readonly cursoActivoIdParaEmpezar: string | null
}

const NIVEL_ETIQUETA: Record<NivelCualitativoArea, string> = {
  solido: "sólido",
  enDesarrollo: "en desarrollo",
  inicial: "inicial",
}

/**
 * Bloque 3 de la bandeja — "Tu camino".
 *
 * Widget cualitativo de la ficha. CERO números crudos: nada de "23 skills",
 * nada de "4/6", nada de barras. Solo una frase narrativa que comunica
 * progreso + top 3 áreas con etiqueta cualitativa.
 *
 * Card plana (sin sombra fuerte, sin gradiente). La aurora se reserva para
 * el hero (siguiente paso) — aquí es solo el acento del número de áreas.
 */
export function BandaTuCamino({ resumen, cursoActivoIdParaEmpezar }: BandaTuCaminoProps) {
  if (resumen === null) {
    return null
  }
  const sinActividad = resumen.totalAreasConActividad === 0
  const todasIniciales =
    resumen.topAreas.length > 0 && resumen.topAreas.every((a) => a.nivelCualitativo === "inicial")

  return (
    <section
      aria-labelledby="tu-camino-titulo"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-7"
    >
      <h2 id="tu-camino-titulo" className="nx-eyebrow text-text-tertiary">
        Tu camino
      </h2>
      {sinActividad ? (
        <EstadoSinActividad cursoActivoIdParaEmpezar={cursoActivoIdParaEmpezar} />
      ) : (
        <EstadoConActividad resumen={resumen} enConstruccion={todasIniciales} />
      )}
      <Link
        to={RUTAS.participante.miFicha}
        className="flex items-center gap-1 self-start text-body-sm text-text-secondary transition-colors duration-base ease-default hover:text-accent"
      >
        Ver mi ficha completa
        <ArrowRight className="h-3.5 w-3.5" aria-hidden={true} />
      </Link>
    </section>
  )
}

interface EstadoConActividadProps {
  readonly resumen: FichaResumenResponse
  readonly enConstruccion: boolean
}

function EstadoConActividad({ resumen, enConstruccion }: EstadoConActividadProps) {
  const total = resumen.totalAreasConActividad
  return (
    <div className="flex flex-col gap-4">
      <p className="text-h3 text-text-primary">
        {enConstruccion ? (
          "Estás en construcción. Sigue avanzando."
        ) : (
          <>
            Has demostrado capacidad en{" "}
            <span className="text-aurora-violet">
              {total} {total === 1 ? "área" : "áreas"}
            </span>
            .
          </>
        )}
      </p>
      <ul className="flex flex-col gap-1.5">
        {resumen.topAreas.slice(0, 3).map((area) => (
          <FilaArea key={area.areaId} area={area} />
        ))}
      </ul>
    </div>
  )
}

function FilaArea({ area }: { readonly area: FichaResumenTopArea }) {
  return (
    <li className="flex items-baseline gap-2">
      <span
        className="font-medium text-body-sm"
        style={{ color: `var(--color-area-${area.areaCodigo}-on-soft)` }}
      >
        {area.areaNombre}
      </span>
      <span aria-hidden={true} className="text-text-tertiary">
        ·
      </span>
      <span className="font-mono text-caption text-text-tertiary uppercase tracking-wider">
        {NIVEL_ETIQUETA[area.nivelCualitativo]}
      </span>
    </li>
  )
}

function EstadoSinActividad({
  cursoActivoIdParaEmpezar,
}: { readonly cursoActivoIdParaEmpezar: string | null }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-h3 text-text-primary">Tu camino comienza aquí.</p>
      <p className="text-body-sm text-text-secondary">
        Aún no has demostrado capacidades. Cada sección que completes va sumando a tu ficha.
      </p>
      {cursoActivoIdParaEmpezar ? (
        <Link
          to={RUTAS.participante.cursoDetalle(cursoActivoIdParaEmpezar)}
          className="flex items-center gap-1 self-start text-accent text-body-sm transition-colors duration-base ease-default hover:text-accent-hover"
        >
          Empezar mi primer curso
          <ArrowRight className="h-3.5 w-3.5" aria-hidden={true} />
        </Link>
      ) : null}
    </div>
  )
}
