import type { ReporteEvaluadorEntrevistaIa } from "@nexott-learn/shared-types"
import { Sparkles } from "lucide-react"

interface ReporteEvaluadorCardProps {
  readonly reporte: ReporteEvaluadorEntrevistaIa | null
}

/**
 * Resumen cualitativo que la IA genero al finalizar el intento. Da contexto
 * al admin para decidir si ajustar la nota o anular: fortalezas, mejoras y
 * justificacion de la nota global. Se persiste en `reporte_evaluador` cuando
 * el intento se cierra; intentos previos a esa funcionalidad llegan en `null`.
 */
export function ReporteEvaluadorCard({ reporte }: ReporteEvaluadorCardProps) {
  if (reporte === null) {
    return (
      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">Analisis del evaluador</span>
        <h2 className="text-h3 text-text-primary">Sin reporte disponible</h2>
        <p className="text-body-sm text-text-secondary">
          Este intento se finalizo antes de que el evaluador generara analisis cualitativo. La nota
          y la rubrica siguen siendo validas para decidir.
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Analisis del evaluador</span>
        <h2 className="text-h3 text-text-primary">Lo que la IA encontro</h2>
        <p className="text-body-sm text-text-secondary">
          Resumen cualitativo de la entrevista. No reemplaza tu criterio — lo complementa.
        </p>
      </header>

      <BloqueLista
        titulo="Fortalezas"
        items={reporte.fortalezas}
        bulletClass="bg-success"
        vacioCopy="Sin fortalezas explicitas."
      />

      <BloqueLista
        titulo="Areas a mejorar"
        items={reporte.mejoras}
        bulletClass="bg-warning"
        vacioCopy="Sin areas de mejora destacadas. Desempeño sostenido."
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-aurora-violet" aria-hidden={true} />
          <span className="nx-eyebrow text-text-tertiary">Justificacion de la nota</span>
        </div>
        <p className="text-body-sm text-text-secondary">{reporte.justificacion}</p>
      </div>
    </section>
  )
}

interface BloqueListaProps {
  readonly titulo: string
  readonly items: readonly string[]
  readonly bulletClass: string
  readonly vacioCopy: string
}

function BloqueLista({ titulo, items, bulletClass, vacioCopy }: BloqueListaProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="nx-eyebrow text-text-tertiary">{titulo}</span>
      {items.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">{vacioCopy}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${bulletClass}`}
                aria-hidden={true}
              />
              <span className="text-body-sm text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
