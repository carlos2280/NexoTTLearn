import { PgSection, PgSwatch } from "./pg-section"

const NEUTROS = [
  { token: "canvas", label: "Canvas" },
  { token: "surface", label: "Surface" },
  { token: "subtle", label: "Subtle" },
  { token: "muted", label: "Muted" },
  { token: "border", label: "Border" },
  { token: "border-strong", label: "Border fuerte" },
  { token: "text-tertiary", label: "Texto terciario", textoSobre: "claro" as const },
  { token: "text-primary", label: "Texto primario", textoSobre: "claro" as const },
]

const ACCION = [
  { token: "accent-soft", label: "Accent soft" },
  { token: "accent", label: "Accent", textoSobre: "claro" as const },
  { token: "accent-hover", label: "Accent hover", textoSobre: "claro" as const },
  { token: "accent-pressed", label: "Accent pressed", textoSobre: "claro" as const },
]

const AURORA = [
  { token: "aurora-cyan", label: "Aurora cyan", textoSobre: "claro" as const },
  { token: "aurora-violet", label: "Aurora violet", textoSobre: "claro" as const },
  { token: "aurora-magenta", label: "Aurora magenta", textoSobre: "claro" as const },
  { token: "aurora-emerald", label: "Aurora emerald", textoSobre: "claro" as const },
]

const SEMANTICOS = [
  { token: "success", label: "Success", textoSobre: "claro" as const },
  { token: "warning", label: "Warning", textoSobre: "claro" as const },
  { token: "danger", label: "Danger", textoSobre: "claro" as const },
  { token: "info", label: "Info", textoSobre: "claro" as const },
]

export function PgPaletas() {
  return (
    <PgSection
      eyebrow="Cimientos · Color"
      titulo="Paletas base"
      descripcion="Tres capas que no se mezclan: neutros para superficies, índigo para acción, aurora como marca, semánticos para feedback."
    >
      <div className="flex flex-col gap-8">
        <SubGrupo titulo="Neutros warm (stone)" swatches={NEUTROS} />
        <SubGrupo titulo="Acción · índigo" swatches={ACCION} />
        <div className="flex flex-col gap-3">
          <SubGrupoHeader titulo="Marca · aurora" />
          <div
            className="h-32 rounded-2xl"
            style={{ background: "var(--gradient-aurora)" }}
            aria-label="Gradiente aurora completo"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AURORA.map((s) => (
              <PgSwatch key={s.token} {...s} />
            ))}
          </div>
        </div>
        <SubGrupo titulo="Feedback · semánticos" swatches={SEMANTICOS} />
      </div>
    </PgSection>
  )
}

interface Swatch {
  readonly token: string
  readonly label: string
  readonly textoSobre?: "claro" | "oscuro"
}

function SubGrupo({ titulo, swatches }: { titulo: string; swatches: readonly Swatch[] }) {
  return (
    <div className="flex flex-col gap-3">
      <SubGrupoHeader titulo={titulo} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {swatches.map((s) => (
          <PgSwatch key={s.token} {...s} />
        ))}
      </div>
    </div>
  )
}

function SubGrupoHeader({ titulo }: { titulo: string }) {
  return <h3 className="text-h3 text-text-primary">{titulo}</h3>
}
