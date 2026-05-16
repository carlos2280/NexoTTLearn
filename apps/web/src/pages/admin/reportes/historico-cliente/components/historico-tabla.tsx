import { Card } from "@/shared/components/ui/card"
import type { HistoricoClienteCursoItem } from "@nexott-learn/shared-types"

interface HistoricoTablaProps {
  readonly cursos: readonly HistoricoClienteCursoItem[]
}

function tokenPorPorcentaje(pct: number): string {
  if (pct >= 70) {
    return "var(--color-state-apto)"
  }
  if (pct >= 40) {
    return "var(--color-state-solido)"
  }
  if (pct >= 20) {
    return "var(--color-state-en-desarrollo)"
  }
  return "var(--color-state-no-apto)"
}

export function HistoricoTabla({ cursos }: HistoricoTablaProps) {
  if (cursos.length === 0) {
    return (
      <Card tono="hueco" densidad="generosa">
        <p className="text-center text-body-sm text-text-secondary">
          Este cliente aún no tiene cursos con presentaciones registradas.
        </p>
      </Card>
    )
  }

  // Ordenados por % de aceptación desc (los más exitosos arriba)
  const ordenados = [...cursos].sort((a, b) => b.porcentajeAceptacion - a.porcentajeAceptacion)

  return (
    <section aria-label="Cursos del cliente" className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Detalle por curso</span>
        <h2 className="text-h3 text-text-primary">Curso por curso</h2>
      </header>

      <ul className="flex flex-col gap-3">
        {ordenados.map((c) => (
          <FilaCurso key={c.cursoId} curso={c} />
        ))}
      </ul>
    </section>
  )
}

interface FilaCursoProps {
  readonly curso: HistoricoClienteCursoItem
}

function FilaCurso({ curso }: FilaCursoProps) {
  const pct = Math.round(curso.porcentajeAceptacion)
  const color = tokenPorPorcentaje(pct)

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-base ease-default hover:border-border-strong hover:shadow-[var(--shadow-card-elevated)]">
      <header className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-body text-text-primary">{curso.titulo}</span>
        <span className="inline-flex items-baseline gap-1.5">
          <span className="tabular font-medium font-mono text-h3" style={{ color }}>
            {pct}%
          </span>
          <span className="text-caption text-text-tertiary">aceptación</span>
        </span>
      </header>

      <div
        className="h-1.5 w-full overflow-hidden rounded-pill bg-subtle"
        role="img"
        aria-label={`Aceptación ${pct}%`}
      >
        <div
          className="h-full rounded-pill transition-all duration-base ease-default"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-text-tertiary">
        <span className="inline-flex items-center gap-1.5">
          Presentados
          <span className="tabular font-medium font-mono text-text-secondary">
            {curso.presentados}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          Aceptados
          <span className="tabular font-medium font-mono text-text-secondary">
            {curso.aceptados}
          </span>
        </span>
      </footer>
    </li>
  )
}
