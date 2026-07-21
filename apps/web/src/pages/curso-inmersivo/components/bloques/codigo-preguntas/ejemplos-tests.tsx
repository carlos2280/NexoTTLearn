import { cn } from "@/shared/lib/cn"
import { extraerTextoPlano } from "@/shared/lib/sanitize-html"
import type { TestStdinStdout } from "@nexott-learn/shared-types"
import { type EjemploVisible, seleccionarEjemplos } from "./seleccionar-ejemplos"

interface EjemplosTestsProps {
  readonly tests: readonly TestStdinStdout[]
}

/**
 * Panel "Ejemplos" bajo el enunciado: lista los tests visibles como pares
 * entrada → salida esperada, siempre a la vista (antes de ejecutar), para que
 * el participante entienda el contrato de I/O sin probar a ciegas. Los tests
 * ocultos NO se muestran. Si no hay ejemplos visibles, no renderiza nada.
 */
export function EjemplosTests({ tests }: EjemplosTestsProps) {
  const ejemplos = seleccionarEjemplos(tests)
  if (ejemplos.length === 0) {
    return null
  }
  return (
    <section aria-label="Ejemplos de entrada y salida" className="flex flex-col gap-2">
      <h3 className="nx-eyebrow text-text-tertiary">Ejemplos</h3>
      <ul className="flex flex-col gap-2">
        {ejemplos.map((ejemplo) => (
          <FilaEjemplo key={ejemplo.id} ejemplo={ejemplo} />
        ))}
      </ul>
    </section>
  )
}

function FilaEjemplo({ ejemplo }: { readonly ejemplo: EjemploVisible }) {
  const descripcion = extraerTextoPlano(ejemplo.descripcion)
  return (
    <li className="rounded-lg border border-border bg-subtle/40 px-3 py-2.5">
      {descripcion ? <p className="mb-2 text-body-sm text-text-secondary">{descripcion}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
        <ParEjemplo etiqueta="entrada" valor={ejemplo.entrada} textoVacio="(sin entrada)" />
        <span
          aria-hidden={true}
          className="hidden shrink-0 self-center font-mono text-text-tertiary sm:block"
        >
          →
        </span>
        <ParEjemplo etiqueta="esperado" valor={ejemplo.salidaEsperada} textoVacio="(vacío)" />
      </div>
    </li>
  )
}

interface ParEjemploProps {
  readonly etiqueta: string
  readonly valor: string
  readonly textoVacio: string
}

function ParEjemplo({ etiqueta, valor, textoVacio }: ParEjemploProps) {
  const esVacio = valor.length === 0
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="font-mono text-[11px] text-text-secondary uppercase tracking-wider">
        {etiqueta}
      </span>
      <span
        className={cn(
          "whitespace-pre-wrap break-words font-mono text-caption",
          esVacio ? "text-text-secondary italic" : "text-text-primary",
        )}
      >
        {esVacio ? textoVacio : valor}
      </span>
    </div>
  )
}
