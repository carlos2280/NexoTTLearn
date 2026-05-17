interface IntentosDeHoyProps {
  readonly usados: number
  readonly max: number
}

/**
 * Tarjeta que comunica la cuota actual de entrevistas (vista 1 — spec 06).
 * Lenguaje natural, sin lenguaje de "cuota" agresivo. El maximo del sistema
 * son 5/hora (D89 + decision 2026-05-15 sobre throttle).
 */
export function IntentosDeHoy({ usados, max }: IntentosDeHoyProps) {
  const restantes = Math.max(0, max - usados)
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
      <h3 className="nx-eyebrow text-text-tertiary">Tus intentos de hoy</h3>
      <p className="text-body-sm text-text-secondary">
        Has usado <span className="font-medium text-text-primary">{usados}</span> de{" "}
        <span className="font-medium text-text-primary">{max}</span> esta hora.
      </p>
      {restantes > 0 ? (
        <p className="text-caption text-text-tertiary">
          {restantes === 1
            ? "Te queda 1 intento esta hora."
            : `Te quedan ${restantes} intentos esta hora.`}
        </p>
      ) : null}
    </section>
  )
}
