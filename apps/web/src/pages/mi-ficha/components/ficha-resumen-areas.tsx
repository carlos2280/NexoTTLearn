import type { GrupoArea } from "../mi-ficha.types"

interface FichaResumenAreasProps {
  readonly grupos: readonly GrupoArea[]
}

export function FichaResumenAreas({ grupos }: FichaResumenAreasProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {grupos.map((grupo) => (
        <TileArea key={grupo.areaId} grupo={grupo} />
      ))}
    </div>
  )
}

interface TileAreaProps {
  readonly grupo: GrupoArea
}

function TileArea({ grupo }: TileAreaProps) {
  const tonoArea = `var(--color-area-${grupo.slug})`
  const promedio = grupo.promedio
  const sinPromedio = promedio === null

  return (
    <article
      className="hover:-translate-y-0.5 group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-base ease-out"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `var(--shadow-glow-area-${grupo.slug})`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-resting)"
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 right-0 left-0 h-[2px]"
        style={{ background: tonoArea }}
      />
      <span className="nx-eyebrow text-text-tertiary">{grupo.nombre}</span>
      <div className="flex items-baseline gap-2">
        {sinPromedio ? (
          <span className="font-mono text-h2 text-text-disabled leading-none">—</span>
        ) : (
          <>
            <span className="tabular font-mono text-display-md text-text-primary leading-none">
              {Math.round(promedio)}
            </span>
            <span className="font-medium text-body-sm text-text-tertiary">/ 100</span>
          </>
        )}
      </div>
      <span className="tabular mt-auto font-mono text-caption text-text-tertiary">
        {grupo.skillsConNota}
        <span className="text-text-disabled"> / </span>
        {grupo.skillsTotales} skills
      </span>
    </article>
  )
}
