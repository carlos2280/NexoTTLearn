import type { ResultadoEjecucionSuite, ResultadoTestUI } from "@/features/codigo-ejecucion"
import { cn } from "@/shared/lib/cn"
import { extraerTextoPlano } from "@/shared/lib/sanitize-html"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef } from "react"

interface TerminalTestsProps {
  readonly ejecucion: ResultadoEjecucionSuite | null
  readonly isEjecutando: boolean
}

/**
 * Consola estilo VSCode integrada bajo el editor. Tres estados:
 *  - Sin ejecución previa: prompt invitando a pulsar "Ejecutar tests" + cursor
 *    parpadeante (firma de "sistema esperando input", no decoración).
 *  - Ejecutando: prompt "ejecutando tests…" con el cursor activo.
 *  - Tras ejecutar: lista de tests con stagger de aparición (~70ms entre
 *    líneas), autoscroll al fondo, fallos compactos con Expected/Received.
 *
 * `useReducedMotion()` neutraliza tanto el stagger como el blink del cursor.
 */
export function TerminalTests({ ejecucion, isEjecutando }: TerminalTestsProps) {
  const reducedMotion = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const totalResultados = ejecucion?.resultados.length ?? 0
  useEffect(() => {
    if (totalResultados === 0) {
      return
    }
    const el = scrollRef.current
    if (!el) {
      return
    }
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    })
  }, [totalResultados, reducedMotion])

  return (
    <section
      aria-label="Consola de resultados"
      className="flex flex-col gap-1 px-4 py-3 font-mono text-[12.5px] leading-[1.55]"
      style={{
        background: "var(--color-code-bg)",
        color: "var(--color-code-text)",
        minHeight: "140px",
      }}
    >
      <CabeceraTerminal ejecucion={ejecucion} isEjecutando={isEjecutando} />
      <div ref={scrollRef} className="max-h-[260px] overflow-y-auto pr-1">
        <CuerpoTerminal
          ejecucion={ejecucion}
          isEjecutando={isEjecutando}
          reducedMotion={Boolean(reducedMotion)}
        />
      </div>
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

interface CuerpoTerminalProps {
  readonly ejecucion: ResultadoEjecucionSuite | null
  readonly isEjecutando: boolean
  readonly reducedMotion: boolean
}

function CuerpoTerminal({ ejecucion, isEjecutando, reducedMotion }: CuerpoTerminalProps) {
  if (isEjecutando) {
    return (
      <LineaPrompt texto="ejecutando tests…" mostrarCursor={true} reducedMotion={reducedMotion} />
    )
  }
  if (!ejecucion) {
    return (
      <LineaPrompt
        texto='pulsa "Ejecutar tests" para empezar'
        mostrarCursor={true}
        reducedMotion={reducedMotion}
      />
    )
  }
  const visibles = ejecucion.resultados.filter((r) => r.visible)
  const ocultos = ejecucion.resultados.filter((r) => !r.visible)
  const ocultosPasados = ocultos.filter((r) => r.paso).length
  const ocultosFallados = ocultos.length - ocultosPasados

  return (
    <div className="flex flex-col gap-0.5 pt-1">
      <AnimatePresence initial={true}>
        {visibles.map((r, i) => (
          <motion.div
            key={r.testId}
            initial={reducedMotion ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.22,
              delay: reducedMotion ? 0 : i * 0.07,
              ease: "easeOut",
            }}
          >
            <FilaTestTerminal resultado={r} />
          </motion.div>
        ))}
      </AnimatePresence>
      {ocultos.length > 0 ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.22,
            delay: reducedMotion ? 0 : visibles.length * 0.07,
            ease: "easeOut",
          }}
        >
          <FilaOcultos
            totales={ocultos.length}
            pasados={ocultosPasados}
            fallados={ocultosFallados}
          />
        </motion.div>
      ) : null}
    </div>
  )
}

interface LineaPromptProps {
  readonly texto: string
  readonly mostrarCursor: boolean
  readonly reducedMotion: boolean
}

function LineaPrompt({ texto, mostrarCursor, reducedMotion }: LineaPromptProps) {
  return (
    <p
      className="flex items-baseline gap-2 pt-1"
      style={{ color: "var(--color-code-line-number)" }}
    >
      <span style={{ color: "var(--color-syntax-keyword)" }}>&gt;</span>
      <span>{texto}</span>
      {mostrarCursor ? <CursorBlink reducedMotion={reducedMotion} /> : null}
    </p>
  )
}

/**
 * Cursor parpadeante. Es la 4ª excepción al "no animaciones infinitas" del
 * manifiesto: no es decoración, comunica "sistema esperando input" igual que
 * `nx-pulse-dot`. Se desactiva con reduced-motion.
 */
function CursorBlink({ reducedMotion }: { readonly reducedMotion: boolean }) {
  if (reducedMotion) {
    return (
      <span
        aria-hidden={true}
        className="inline-block h-[1em] w-[7px] translate-y-[2px] align-baseline"
        style={{ background: "var(--color-syntax-keyword)" }}
      />
    )
  }
  return (
    <motion.span
      aria-hidden={true}
      className="inline-block h-[1em] w-[7px] translate-y-[2px] align-baseline"
      style={{ background: "var(--color-syntax-keyword)" }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
    />
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
          {extraerTextoPlano(resultado.descripcion) || resultado.testId}
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
