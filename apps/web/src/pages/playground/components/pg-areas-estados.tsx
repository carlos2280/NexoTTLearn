import { PgSection } from "./pg-section"

const AREAS = [
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "cloud", label: "Cloud" },
  { id: "data", label: "Data" },
  { id: "mobile", label: "Mobile" },
  { id: "devops", label: "DevOps" },
  { id: "qa", label: "QA / Testing" },
  { id: "soft", label: "Soft Skills" },
] as const

const ESTADOS = [
  { id: "pendiente", label: "Pendiente" },
  { id: "progreso", label: "En progreso" },
  { id: "en-desarrollo", label: "En desarrollo" },
  { id: "solido", label: "Sólido" },
  { id: "apto", label: "Apto" },
  { id: "no-apto", label: "No apto" },
  { id: "completado", label: "Completado" },
] as const

export function PgAreasEstados() {
  return (
    <div className="flex flex-col gap-16">
      <PgSection
        eyebrow="Sistema · Dominio"
        titulo="Áreas técnicas"
        descripcion="Cada área de skills tiene tinta, soft y glow propios. Las cards de curso heredan su color."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {AREAS.map((area) => (
            <AreaChip key={area.id} id={area.id} label={area.label} />
          ))}
        </div>
      </PgSection>

      <PgSection
        eyebrow="Sistema · Progreso"
        titulo="Estados de competencia"
        descripcion="El veredicto interno se comunica con su propia familia de color. Nunca se mezcla con la capa marca."
      >
        <div className="flex flex-wrap gap-2.5">
          {ESTADOS.map((e) => (
            <EstadoBadge key={e.id} id={e.id} label={e.label} />
          ))}
          <CertificadoBadge />
        </div>
      </PgSection>
    </div>
  )
}

interface AreaChipProps {
  readonly id: string
  readonly label: string
}

function AreaChip({ id, label }: AreaChipProps) {
  return (
    <div
      className="group hover:-translate-y-0.5 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all duration-base ease-out"
      style={{
        boxShadow: "var(--shadow-card-resting)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `var(--shadow-glow-area-${id})`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-resting)"
      }}
    >
      <div
        className="h-10 w-10 rounded-xl"
        style={{
          background: `linear-gradient(135deg, var(--color-area-${id}), rgb(var(--color-area-${id}-rgb) / 0.6))`,
        }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-body-sm text-text-primary">{label}</span>
        <span className="font-mono text-[10px] text-text-tertiary">area.{id}</span>
      </div>
    </div>
  )
}

interface EstadoBadgeProps {
  readonly id: string
  readonly label: string
}

function EstadoBadge({ id, label }: EstadoBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-medium text-caption"
      style={{
        background: `var(--color-state-${id}-soft)`,
        borderColor: `rgb(var(--color-state-${id}-rgb) / 0.3)`,
        color: `var(--color-state-${id}-on-soft)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-pill"
        style={{ background: `var(--color-state-${id})` }}
      />
      {label}
    </span>
  )
}

function CertificadoBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-semibold text-caption text-white"
      style={{
        background: "var(--gradient-aurora)",
        boxShadow: "var(--shadow-aurora-glow)",
      }}
    >
      ★ Certificado
    </span>
  )
}
