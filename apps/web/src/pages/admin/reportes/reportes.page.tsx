import { ReporteCard } from "./components/reporte-card"
import { REPORTES, type ReporteSeccion } from "./reportes.types"

const SECCIONES: ReadonlyArray<{
  readonly id: ReporteSeccion
  readonly eyebrow: string
  readonly titulo: string
  readonly descripcion: string
}> = [
  {
    id: "operativos",
    eyebrow: "Operativos · Uso diario",
    titulo: "Estado del trabajo en curso",
    descripcion:
      "Lectura inmediata de lo que está pasando ahora. Sin export, pensados para consulta rápida.",
  },
  {
    id: "estrategicos",
    eyebrow: "Estratégicos · Decisión",
    titulo: "Inteligencia para decidir",
    descripcion:
      "Visión consolidada con histórico. Exportables a CSV, XLSX y PDF. Cada consulta queda auditada.",
  },
]

export function ReportesPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-16">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Reportes · Inteligencia operativa</span>
        <h1 className="text-h1 text-text-primary">
          Reportes<span className="text-aurora-violet">.</span>
        </h1>
        <p className="max-w-[640px] text-body text-text-secondary">
          Ocho lecturas del sistema, en dos planos: lo que necesita atención hoy y lo que orienta la
          decisión a mediano plazo.
        </p>
      </header>

      {SECCIONES.map((seccion) => {
        const reportes = REPORTES.filter((r) => r.seccion === seccion.id)
        return (
          <section key={seccion.id} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="nx-eyebrow text-text-tertiary">{seccion.eyebrow}</span>
              <h2 className="text-h2 text-text-primary">{seccion.titulo}</h2>
              <p className="max-w-[640px] text-body-sm text-text-secondary">
                {seccion.descripcion}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {reportes.map((reporte) => (
                <ReporteCard key={reporte.slug} reporte={reporte} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
