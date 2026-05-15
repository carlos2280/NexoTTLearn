import type { FilaAvanceCurso } from "@nexott-learn/shared-types"

interface AvanceResumenProps {
  readonly filas: readonly FilaAvanceCurso[]
  readonly total: number
}

function calcular(filas: readonly FilaAvanceCurso[], total: number) {
  if (filas.length === 0) {
    return { total, promedio: 0, conAlertas: 0, completados: 0 }
  }
  const suma = filas.reduce((s, f) => s + f.porcentajeAvance, 0)
  const promedio = Math.round(suma / filas.length)
  const conAlertas = filas.filter((f) => f.alertas.length > 0).length
  const completados = filas.filter((f) => f.porcentajeAvance >= 100).length
  return { total, promedio, conAlertas, completados }
}

export function AvanceResumen({ filas, total }: AvanceResumenProps) {
  const m = calcular(filas, total)
  return (
    <section
      aria-label="Resumen del curso"
      className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)] md:grid-cols-4"
    >
      <Metrica eyebrow="Asignaciones" valor={m.total} />
      <Metrica eyebrow="Avance promedio" valor={`${m.promedio}%`} />
      <Metrica
        eyebrow="Con alertas"
        valor={m.conAlertas}
        tono={m.conAlertas > 0 ? "warning" : "neutro"}
      />
      <Metrica eyebrow="Completados" valor={m.completados} tono="success" />
    </section>
  )
}

interface MetricaProps {
  readonly eyebrow: string
  readonly valor: number | string
  readonly tono?: "neutro" | "warning" | "success"
}

function Metrica({ eyebrow, valor, tono = "neutro" }: MetricaProps) {
  const color =
    tono === "warning"
      ? "text-warning-on-soft"
      : tono === "success"
        ? "text-success-on-soft"
        : "text-text-primary"
  return (
    <div className="flex flex-col gap-1">
      <span className="nx-eyebrow text-text-tertiary">{eyebrow}</span>
      <span
        className={`tabular font-medium font-mono text-h2 leading-none tracking-tight ${color}`}
      >
        {valor}
      </span>
    </div>
  )
}
