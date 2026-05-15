import type { ResultadoEjecucionSuite, ResultadoTestUI } from "@/features/codigo-ejecucion"
import { cn } from "@/shared/lib/cn"
import { Check, Clock, X } from "lucide-react"

interface ResultadosTestsProps {
  readonly ejecucion: ResultadoEjecucionSuite
}

/**
 * Muestra el detalle por test tras ejecutar en el navegador. Solo se listan
 * los tests `visible=true`; los invisibles aparecen agregados como "X tests
 * adicionales" para no exponer la salida esperada en pantalla.
 */
export function ResultadosTests({ ejecucion }: ResultadosTestsProps) {
  const visibles = ejecucion.resultados.filter((r) => r.visible)
  const ocultos = ejecucion.resultados.filter((r) => !r.visible)
  const ocultosPasados = ocultos.filter((r) => r.paso).length

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between">
        <span className="nx-eyebrow text-text-tertiary">
          Tests · {ejecucion.testsPasados} / {ejecucion.testsTotales}
        </span>
      </header>
      <ul className="flex flex-col gap-1.5">
        {visibles.map((resultado) => (
          <li key={resultado.testId}>
            <FilaTest resultado={resultado} />
          </li>
        ))}
        {ocultos.length > 0 ? (
          <li className="rounded-xl border border-border bg-subtle px-3 py-2 text-body-sm text-text-secondary">
            {ocultosPasados} / {ocultos.length} tests adicionales pasaron.
          </li>
        ) : null}
      </ul>
    </section>
  )
}

function FilaTest({ resultado }: { readonly resultado: ResultadoTestUI }) {
  const aprobado = resultado.paso
  const esTimeout = resultado.estado === "timeout"
  return (
    <article
      className={cn(
        "flex flex-col gap-1 rounded-xl border px-3 py-2",
        aprobado
          ? "border-success/30 bg-success-soft"
          : esTimeout
            ? "border-warmth/30 bg-warning-soft"
            : "border-danger/30 bg-danger-soft",
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex items-center gap-1.5 text-body-sm",
            aprobado
              ? "text-success-on-soft"
              : esTimeout
                ? "text-warning-on-soft"
                : "text-danger-on-soft",
          )}
        >
          <IconoEstado paso={aprobado} timeout={esTimeout} />
          {resultado.descripcion || resultado.testId}
        </span>
        <span className="font-mono text-[10px] text-text-tertiary tracking-wider">
          {resultado.duracionMs}ms
        </span>
      </header>
      {aprobado ? null : <DetalleFallo resultado={resultado} />}
    </article>
  )
}

function IconoEstado({ paso, timeout }: { readonly paso: boolean; readonly timeout: boolean }) {
  if (paso) {
    return <Check className="h-3.5 w-3.5" aria-hidden={true} />
  }
  if (timeout) {
    return <Clock className="h-3.5 w-3.5" aria-hidden={true} />
  }
  return <X className="h-3.5 w-3.5" aria-hidden={true} />
}

function DetalleFallo({ resultado }: { readonly resultado: ResultadoTestUI }) {
  if (resultado.estado === "timeout") {
    return <p className="font-mono text-caption text-warning-on-soft">Excedió el tiempo límite.</p>
  }
  return (
    <div className="grid grid-cols-2 gap-2 font-mono text-caption">
      <div>
        <p className="text-text-tertiary uppercase tracking-wider">Esperado</p>
        <pre className="overflow-x-auto whitespace-pre-wrap text-text-secondary">
          {resultado.stdoutEsperado || "(vacío)"}
        </pre>
      </div>
      <div>
        <p className="text-text-tertiary uppercase tracking-wider">Obtenido</p>
        <pre className="overflow-x-auto whitespace-pre-wrap text-text-secondary">
          {resultado.stdoutObtenido || "(vacío)"}
        </pre>
      </div>
      {resultado.stderr ? (
        <div className="col-span-2">
          <p className="text-text-tertiary uppercase tracking-wider">Error</p>
          <pre className="overflow-x-auto whitespace-pre-wrap text-danger-on-soft">
            {resultado.stderr}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
