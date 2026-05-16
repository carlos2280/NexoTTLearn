import type { ResultadoEjecucionSuite, ResultadoTestUI } from "@/features/codigo-ejecucion"
import { cn } from "@/shared/lib/cn"

interface TerminalTestsProps {
  readonly ejecucion: ResultadoEjecucionSuite | null
  readonly isEjecutando: boolean
}

/**
 * Consola estilo VSCode integrada bajo el editor. Tres estados:
 *  - Sin ejecución previa: prompt invitando a pulsar "Ejecutar tests".
 *  - Ejecutando: prompt animado "ejecutando tests…".
 *  - Tras ejecutar: lista de tests visibles con prefijo ✓ / ✗, detalle de
 *    expected/received para los fallos, y agregado de tests ocultos sin
 *    revelar la entrada.
 */
export function TerminalTests({ ejecucion, isEjecutando }: TerminalTestsProps) {
  return (
    <section
      aria-label="Consola de resultados"
      className="flex flex-col gap-1 px-4 py-3 font-mono text-[12.5px] leading-[1.55]"
      style={{
        background: "var(--color-code-bg)",
        color: "var(--color-code-text)",
        minHeight: "120px",
      }}
    >
      <CabeceraTerminal ejecucion={ejecucion} isEjecutando={isEjecutando} />
      <CuerpoTerminal ejecucion={ejecucion} isEjecutando={isEjecutando} />
    </section>
  )
}

function CabeceraTerminal({
  ejecucion,
  isEjecutando,
}: {
  readonly ejecucion: ResultadoEjecucionSuite | null
  readonly isEjecutando: boolean
}) {
  const etiqueta = isEjecutando
    ? "ejecutando…"
    : ejecucion
      ? `${ejecucion.testsPasados} / ${ejecucion.testsTotales} pasaron`
      : "esperando"
  return (
    <header className="flex items-center justify-between border-white/10 border-b pb-2 text-[10px] uppercase tracking-[0.22em]">
      <span style={{ color: "var(--color-code-line-number)" }}>Terminal</span>
      <span style={{ color: "var(--color-code-line-number)" }}>{etiqueta}</span>
    </header>
  )
}

function CuerpoTerminal({
  ejecucion,
  isEjecutando,
}: {
  readonly ejecucion: ResultadoEjecucionSuite | null
  readonly isEjecutando: boolean
}) {
  if (isEjecutando) {
    return <LineaPrompt texto="ejecutando tests…" />
  }
  if (!ejecucion) {
    return <LineaPrompt texto='pulsa "Ejecutar tests" para empezar' />
  }
  const visibles = ejecucion.resultados.filter((r) => r.visible)
  const ocultos = ejecucion.resultados.filter((r) => !r.visible)
  const ocultosPasados = ocultos.filter((r) => r.paso).length
  const ocultosFallados = ocultos.length - ocultosPasados

  return (
    <div className="flex flex-col gap-0.5 pt-1">
      {visibles.map((r) => (
        <FilaTestTerminal key={r.testId} resultado={r} />
      ))}
      {ocultos.length > 0 ? (
        <FilaOcultos totales={ocultos.length} pasados={ocultosPasados} fallados={ocultosFallados} />
      ) : null}
    </div>
  )
}

function LineaPrompt({ texto }: { readonly texto: string }) {
  return (
    <p
      className="flex items-baseline gap-2 pt-1"
      style={{ color: "var(--color-code-line-number)" }}
    >
      <span style={{ color: "var(--color-syntax-keyword)" }}>&gt;</span>
      <span>{texto}</span>
    </p>
  )
}

function FilaTestTerminal({ resultado }: { readonly resultado: ResultadoTestUI }) {
  const aprobado = resultado.paso
  const esTimeout = resultado.estado === "timeout"
  const simbolo = aprobado ? "✓" : esTimeout ? "⏱" : "✗"
  const colorVar = aprobado
    ? "var(--color-test-pass)"
    : esTimeout
      ? "var(--color-warmth)"
      : "var(--color-test-fail)"
  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex items-baseline gap-2">
        <span className="w-3 shrink-0" style={{ color: colorVar }}>
          {simbolo}
        </span>
        <span className={cn(aprobado ? "text-white/85" : "text-white")}>
          {resultado.descripcion || resultado.testId}
        </span>
        <span
          className="ml-auto text-[10px] tracking-wider"
          style={{ color: "var(--color-code-line-number)" }}
        >
          {resultado.duracionMs}ms
        </span>
      </p>
      {aprobado ? null : <DetalleFalloTerminal resultado={resultado} />}
    </div>
  )
}

function DetalleFalloTerminal({ resultado }: { readonly resultado: ResultadoTestUI }) {
  if (resultado.estado === "timeout") {
    return (
      <p className="pl-5 text-white/70" style={{ color: "var(--color-warmth)" }}>
        excedió el tiempo límite
      </p>
    )
  }
  return (
    <div
      className="flex flex-col gap-0 pl-5 text-[11.5px]"
      style={{ color: "var(--color-code-line-number)" }}
    >
      <p>
        <span className="opacity-70">Expected: </span>
        <span style={{ color: "var(--color-test-pass)" }}>
          {resultado.stdoutEsperado || "(vacío)"}
        </span>
      </p>
      <p>
        <span className="opacity-70">Received: </span>
        <span style={{ color: "var(--color-test-fail)" }}>
          {resultado.stdoutObtenido || "(vacío)"}
        </span>
      </p>
      {resultado.stderr ? (
        <p>
          <span className="opacity-70">stderr: </span>
          <span style={{ color: "var(--color-test-fail)" }}>{resultado.stderr}</span>
        </p>
      ) : null}
    </div>
  )
}

function FilaOcultos({
  totales,
  pasados,
  fallados,
}: {
  readonly totales: number
  readonly pasados: number
  readonly fallados: number
}) {
  const todoOk = fallados === 0
  return (
    <p className="flex items-baseline gap-2 pt-1">
      <span
        className="w-3 shrink-0"
        style={{ color: todoOk ? "var(--color-test-pass)" : "var(--color-test-fail)" }}
      >
        {todoOk ? "✓" : "✗"}
      </span>
      <span className="text-white/70">
        {pasados} / {totales} casos ocultos pasaron
      </span>
    </p>
  )
}
