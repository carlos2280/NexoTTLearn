/**
 * Texto fijo del sistema que describe al participante cómo se evalúa su
 * entrega. El transversal se evalúa con UNA sola capa: la IA revisa el
 * repositorio entregado (decisión producto 2026-07-11, colapso a una capa).
 */
export function LoQueSeEvaluara() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h3 className="nx-eyebrow text-text-tertiary">Lo que se evaluará</h3>
      <div className="flex items-start gap-3">
        <span
          aria-hidden={true}
          className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-aurora-violet"
        />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-body text-text-primary">Revisión con IA</p>
          <p className="text-body-sm text-text-secondary">
            Se analiza tu repositorio: orden del código, claridad y buenas prácticas.
          </p>
        </div>
      </div>
    </section>
  )
}
