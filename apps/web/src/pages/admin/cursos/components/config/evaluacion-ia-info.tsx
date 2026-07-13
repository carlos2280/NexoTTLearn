import { ScanSearch } from "lucide-react"

/**
 * Bloque informativo del transversal: la evaluación es UNA sola capa
 * (revisión con IA sobre el repositorio entregado). Reemplaza al antiguo
 * bloque de 3 capas con pesos. No edita nada: el modelo del form fija los
 * pesos/flags a "una capa IA" (ver `transversal-form.ts`).
 */
export function EvaluacionIaInfo() {
  return (
    <div className="flex flex-col gap-2">
      <span className="nx-eyebrow text-text-tertiary">Evaluación del proyecto</span>
      <div className="flex items-start gap-3 rounded-lg border border-border p-4">
        <ScanSearch aria-hidden={true} className="mt-0.5 h-5 w-5 shrink-0 text-text-tertiary" />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-body text-text-primary">Revisión con IA</p>
          <p className="text-body-sm text-text-secondary">
            La IA revisa el repositorio entregado: estructura del código, claridad y buenas
            prácticas. Devuelve una nota y un comentario.
          </p>
        </div>
      </div>
    </div>
  )
}
