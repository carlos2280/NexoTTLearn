interface Paso {
  readonly id: string
  readonly etiqueta: string
}

const PASOS: readonly Paso[] = [
  { id: "config-areas", etiqueta: "Áreas" },
  { id: "config-skills", etiqueta: "Skills" },
  { id: "config-modulos", etiqueta: "Módulos" },
  { id: "config-pesos", etiqueta: "Pesos" },
  { id: "config-umbrales", etiqueta: "Umbrales" },
  { id: "config-transversal", etiqueta: "Transversal" },
  { id: "config-entrevista", etiqueta: "Entrevista IA" },
]

/**
 * Header de orientación de la tab Configuración.
 *
 * Pensado para un admin nuevo: explica qué hace en esta pantalla y le sugiere
 * un orden razonable a través de chips de anclaje. Cada chip salta a la
 * sección correspondiente con scroll suave.
 */
export function ConfigHeader() {
  return (
    <header className="flex flex-col gap-5 border-border border-b pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-aurora-violet">Configuración · Admin</span>
        <h2 className="text-h1 text-text-primary">Cómo se evalúa este curso</h2>
        <p className="max-w-2xl text-body text-text-secondary">
          Define qué exige el cliente, cómo se mezclan las notas y qué soporte (proyecto, entrevista
          IA) acompaña al colaborador. Cada bloque tiene una ayuda{" "}
          <kbd className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-subtle text-[10px] text-text-tertiary">
            ?
          </kbd>{" "}
          que explica qué hace y cuándo cambiarlo.
        </p>
      </div>

      <nav aria-label="Flujo recomendado de configuración">
        <ol className="flex flex-wrap items-center gap-2">
          {PASOS.map((paso, indice) => (
            <li key={paso.id}>
              <a
                href={`#${paso.id}`}
                className="group hover:-translate-y-0.5 inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 text-body-sm text-text-secondary shadow-xs transition-[transform,border-color,box-shadow,color] duration-base ease-default hover:border-aurora-violet/40 hover:text-text-primary hover:shadow-sm"
              >
                <span className="tabular font-mono text-[11px] text-aurora-violet">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <span>{paso.etiqueta}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}
