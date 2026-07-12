interface LoQueSeEvaluaraProps {
  /**
   * "Lista a evaluar" que redactó el admin. Si trae ítems, se muestran para que
   * el participante sepa con qué lo van a medir antes de entregar. Vacía = solo
   * el texto genérico de la revisión con IA.
   */
  readonly criterios?: readonly string[]
}

/**
 * Describe al participante cómo se evalúa su entrega. El transversal se evalúa
 * con UNA sola capa: la IA revisa el repositorio entregado (decisión producto
 * 2026-07-11, colapso a una capa). Si el admin declaró una "Lista a evaluar",
 * se muestra debajo como los puntos concretos que se revisarán.
 */
export function LoQueSeEvaluara({ criterios = [] }: LoQueSeEvaluaraProps) {
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

      {criterios.length > 0 ? (
        <div className="flex flex-col gap-2 border-border border-t pt-4">
          <p className="text-body-sm text-text-secondary">Vamos a fijarnos en:</p>
          <ul className="flex flex-col gap-1.5">
            {criterios.map((criterio, i) => (
              // Viñeta neutra (no un ✓): son criterios por evaluar, no logros ya cumplidos.
              // biome-ignore lint/suspicious/noArrayIndexKey: dos criterios pueden tener el mismo texto.
              <li key={`${i}-${criterio}`} className="flex items-start gap-2.5">
                <span
                  aria-hidden={true}
                  className="mt-2 inline-block h-1 w-1 shrink-0 rounded-pill bg-text-tertiary"
                />
                <span className="text-body-sm text-text-primary">{criterio}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
