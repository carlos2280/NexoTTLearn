import { PgSection } from "./pg-section"

const ESCALA = [
  {
    clase: "text-display-xl",
    label: "display-xl · 96px",
    sample: "NexoTT",
    notas: "Hero marketing, certificado",
  },
  {
    clase: "text-display-lg",
    label: "display-lg · 64px",
    sample: "Bienvenido",
    notas: "Bienvenida del colaborador",
  },
  {
    clase: "text-display-md",
    label: "display-md · 44px",
    sample: "Tu siguiente paso",
    notas: "Headings cumbre del día",
  },
  { clase: "text-h1", label: "h1 · 36px", sample: "Plan de estudio", notas: "Título de pantalla" },
  {
    clase: "text-h2",
    label: "h2 · 24px",
    sample: "Módulo: Pandas básico",
    notas: "Sección dentro de pantalla",
  },
  {
    clase: "text-h3",
    label: "h3 · 20px",
    sample: "Cuidado con el índice implícito",
    notas: "Sub-sección, card title",
  },
  {
    clase: "text-body-lg",
    label: "body-lg · 16px",
    sample: "Vamos a explorar cómo Pandas estructura los datos.",
    notas: "Párrafos hero",
  },
  {
    clase: "text-body",
    label: "body · 14px",
    sample: "El DataFrame es la unidad central de Pandas para manipular tablas.",
    notas: "Body base",
  },
  {
    clase: "text-body-sm",
    label: "body-sm · 13px",
    sample: "Aplica a versiones 2.x en adelante. Ver notas del módulo.",
    notas: "Densos, secundarios",
  },
  {
    clase: "text-caption",
    label: "caption · 12px",
    sample: "Última edición hace 3 min",
    notas: "Hints, microcopy",
  },
] as const

export function PgTipografia() {
  return (
    <PgSection
      eyebrow="Cimientos · Tipografía"
      titulo="Escala completa"
      descripcion="Manrope para todo. Geist Mono para datos técnicos. Fraunces italic solo para momentos emocionales."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
          {ESCALA.map((item) => (
            <div
              key={item.clase}
              className="flex flex-col gap-1 border-border/60 border-b py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <span className={`${item.clase} text-text-primary`}>{item.sample}</span>
              <div className="flex shrink-0 flex-col items-end gap-0 text-right">
                <span className="font-mono text-[11px] text-text-tertiary">{item.label}</span>
                <span className="text-caption text-text-tertiary">{item.notas}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FamiliaCard
            titulo="Manrope"
            etiqueta="sans"
            descripcion="Body, UI, headings. Geométrica y joven."
            estilo="font-sans"
            sample="Aa Bb Cc 123"
          />
          <FamiliaCard
            titulo="Geist Mono"
            etiqueta="mono"
            descripcion="Código, IDs, métricas tabulares."
            estilo="font-mono"
            sample="python.fastapi"
          />
          <FamiliaCard
            titulo="Fraunces"
            etiqueta="serif italic"
            descripcion="Solo momentos emocionales."
            estilo="font-serif italic"
            sample="Carlos"
          />
        </div>
      </div>
    </PgSection>
  )
}

interface FamiliaCardProps {
  readonly titulo: string
  readonly etiqueta: string
  readonly descripcion: string
  readonly estilo: string
  readonly sample: string
}

function FamiliaCard({ titulo, etiqueta, descripcion, estilo, sample }: FamiliaCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
      <span className={`${estilo} text-h2 text-text-primary`}>{sample}</span>
      <div className="mt-auto">
        <div className="font-semibold text-body-sm text-text-primary">{titulo}</div>
        <div className="text-caption text-text-secondary">{descripcion}</div>
      </div>
    </div>
  )
}
