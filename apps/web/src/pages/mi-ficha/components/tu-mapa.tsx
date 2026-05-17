import { slugArea } from "@/shared/lib/slug-area"
import type { FichaPorAreaItem, NivelCualitativoArea } from "@nexott-learn/shared-types"

interface TuMapaProps {
  readonly porArea: readonly FichaPorAreaItem[]
  readonly onAreaClick?: (areaId: string) => void
}

const ORDEN_AREAS = [
  "frontend",
  "backend",
  "cloud",
  "data",
  "mobile",
  "devops",
  "qa",
  "soft",
] as const

const ETIQUETA_NIVEL: Record<NivelCualitativoArea, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  inicial: "Inicial",
  sinTocar: "Por explorar",
}

// 5 dots fijos por area: 5/4/3/2/0 segun nivel.
const DOTS_LLENOS: Record<NivelCualitativoArea, number> = {
  excelencia: 5,
  solido: 4,
  enDesarrollo: 3,
  inicial: 2,
  sinTocar: 0,
}

const TOTAL_DOTS = 5

export function TuMapa({ porArea, onAreaClick }: TuMapaProps) {
  const ordenado = [...porArea].sort((a, b) => {
    const ia = ORDEN_AREAS.indexOf(slugArea(a.nombre))
    const ib = ORDEN_AREAS.indexOf(slugArea(b.nombre))
    if (ia !== ib) {
      return ia - ib
    }
    return a.nombre.localeCompare(b.nombre, "es")
  })

  return (
    <section className="flex flex-col gap-5" aria-labelledby="tu-mapa-titulo">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Tu mapa</span>
        <h2 id="tu-mapa-titulo" className="text-h2 text-text-primary">
          Las 8 areas
        </h2>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ordenado.map((area) => (
          <AreaCard key={area.areaId} area={area} onClick={onAreaClick} />
        ))}
      </div>
    </section>
  )
}

interface AreaCardProps {
  readonly area: FichaPorAreaItem
  readonly onClick?: (areaId: string) => void
}

function AreaCard({ area, onClick }: AreaCardProps) {
  const slug = slugArea(area.nombre)
  const nivel = area.nivelCualitativo
  const sinTocar = nivel === "sinTocar"
  const llenos = DOTS_LLENOS[nivel]
  const colorArea = `var(--color-area-${slug})`
  const glow = `var(--shadow-glow-area-${slug})`

  const subtexto = sinTocar
    ? "Esta capacidad espera"
    : `${area.skillsConNota} ${area.skillsConNota === 1 ? "hab." : "hab."}`

  return (
    <button
      type="button"
      onClick={() => onClick?.(area.areaId)}
      className={`hover:-translate-y-0.5 group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 text-left transition-all duration-base ease-out ${
        sinTocar ? "opacity-70 hover:opacity-90" : ""
      }`}
      style={{ boxShadow: "var(--shadow-card-resting)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = glow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-resting)"
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 right-0 left-0 h-[2px]"
        style={{ background: colorArea }}
      />
      <span className="nx-eyebrow text-text-tertiary">{area.nombre}</span>

      <span aria-hidden="true" className="flex items-center gap-1.5">
        {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
          const lleno = i < llenos
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: lista fija de 5 dots, el indice ES la identidad
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                background: lleno ? colorArea : "transparent",
                border: lleno ? "none" : "1px solid var(--color-border-strong)",
              }}
            />
          )
        })}
      </span>

      <span
        className={`font-medium text-body-sm ${sinTocar ? "text-text-tertiary" : "text-text-primary"}`}
      >
        {ETIQUETA_NIVEL[nivel]}
      </span>

      <span className="mt-auto text-caption text-text-tertiary">{subtexto}</span>
    </button>
  )
}
