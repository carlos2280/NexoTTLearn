import type { ResultadoEjecucionSql, ResultadoTestSqlUI } from "@/features/sql-ejecucion"
import { extraerTextoPlano } from "@/shared/lib/sanitize-html"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef } from "react"
import { GrillaResultados } from "./grilla-resultados"

interface TerminalSqlProps {
  readonly ejecucion: ResultadoEjecucionSql | null
  readonly isEjecutando: boolean
}

/**
 * Consola estilo VSCode bajo el editor SQL. Igual que `TerminalTests` pero el
 * detalle de un fallo visible no es Expected/Received de texto: son dos
 * mini-tablas (filas obtenidas vs esperadas). Los tests ocultos se resumen.
 * `useReducedMotion()` neutraliza el stagger.
 */
export function TerminalSql({ ejecucion, isEjecutando }: TerminalSqlProps) {
  const reducedMotion = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const total = ejecucion?.resultados.length ?? 0
  useEffect(() => {
    if (total === 0) {
      return
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" })
  }, [total])

  const etiqueta = isEjecutando
    ? "ejecutando…"
    : ejecucion
      ? `${ejecucion.testsPasados} / ${ejecucion.testsTotales} pasaron`
      : "esperando"

  return (
    <section
      aria-label="Consola de resultados SQL"
      className="flex flex-col gap-1 px-4 py-3 font-code text-[12.5px] leading-[1.55]"
      style={{
        background: "var(--color-code-bg)",
        color: "var(--color-code-text)",
        minHeight: "140px",
      }}
    >
      {/* `<output>` (rol status implícito, live polite): anuncia el desenlace al
          lector de pantalla UNA vez al terminar (no el stream fila a fila). WCAG 2.2 §4.1.3. */}
      <output className="sr-only">{resumenAccesibleSql(ejecucion, isEjecutando)}</output>
      <header className="flex items-center justify-between border-white/10 border-b pb-2 text-[10px] uppercase tracking-[0.22em]">
        <span style={{ color: "var(--color-code-line-number)" }}>Terminal</span>
        <span style={{ color: "var(--color-code-line-number)" }}>{etiqueta}</span>
      </header>
      <div ref={scrollRef} className="max-h-[320px] overflow-y-auto pr-1">
        <CuerpoTerminalSql
          ejecucion={ejecucion}
          isEjecutando={isEjecutando}
          reducedMotion={Boolean(reducedMotion)}
        />
      </div>
    </section>
  )
}

/**
 * Frase de desenlace para el lector de pantalla. Vacía mientras se ejecuta o si
 * no hay ejecución previa, para que la región live solo anuncie el resultado
 * final.
 */
export function resumenAccesibleSql(
  ejecucion: ResultadoEjecucionSql | null,
  isEjecutando: boolean,
): string {
  if (isEjecutando || !ejecucion) {
    return ""
  }
  const fallados = ejecucion.testsTotales - ejecucion.testsPasados
  if (fallados === 0) {
    return `Consulta ejecutada: pasaron las ${ejecucion.testsTotales} pruebas.`
  }
  return `Consulta ejecutada: ${ejecucion.testsPasados} de ${ejecucion.testsTotales} pruebas pasaron; ${fallados} fallaron.`
}

interface CuerpoProps {
  readonly ejecucion: ResultadoEjecucionSql | null
  readonly isEjecutando: boolean
  readonly reducedMotion: boolean
}

function CuerpoTerminalSql({ ejecucion, isEjecutando, reducedMotion }: CuerpoProps) {
  if (isEjecutando) {
    return <LineaPrompt texto="ejecutando consulta…" />
  }
  if (!ejecucion) {
    return <LineaPrompt texto='pulsa "Ejecutar" para correr tu consulta' />
  }
  const visibles = ejecucion.resultados.filter((r) => r.visible)
  const ocultos = ejecucion.resultados.filter((r) => !r.visible)
  const ocultosPasados = ocultos.filter((r) => r.paso).length

  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <AnimatePresence initial={true}>
        {visibles.map((r, i) => (
          <motion.div
            key={r.testId}
            initial={reducedMotion ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, delay: reducedMotion ? 0 : i * 0.07, ease: "easeOut" }}
          >
            <FilaTestSql resultado={r} />
          </motion.div>
        ))}
      </AnimatePresence>
      {ocultos.length > 0 ? (
        <FilaOcultos totales={ocultos.length} pasados={ocultosPasados} />
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

function FilaTestSql({ resultado }: { readonly resultado: ResultadoTestSqlUI }) {
  const aprobado = resultado.paso
  const esTimeout = resultado.estado === "timeout"
  const simbolo = aprobado ? "✓" : esTimeout ? "⏱" : "✗"
  const colorVar = aprobado
    ? "var(--color-test-pass)"
    : esTimeout
      ? "var(--color-warmth)"
      : "var(--color-test-fail)"
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-baseline gap-2">
        <span className="w-3 shrink-0" style={{ color: colorVar }}>
          {simbolo}
        </span>
        <span className={aprobado ? "text-white/85" : "text-white"}>
          {extraerTextoPlano(resultado.descripcion) || resultado.testId}
        </span>
        <span
          className="ml-auto text-[10px] tracking-wider"
          style={{ color: "var(--color-code-line-number)" }}
        >
          {resultado.duracionMs}ms
        </span>
      </p>
      {aprobado ? null : <DetalleFalloSql resultado={resultado} />}
    </div>
  )
}

function DetalleFalloSql({ resultado }: { readonly resultado: ResultadoTestSqlUI }) {
  if (resultado.error) {
    return (
      <p className="pl-5" style={{ color: "var(--color-test-fail)" }}>
        {resultado.error}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2 pl-5">
      <GrillaResultados
        titulo="Obtenido"
        conjunto={resultado.obtenido}
        colorTitulo="var(--color-test-fail)"
      />
      <GrillaResultados
        titulo="Esperado"
        conjunto={resultado.esperado}
        colorTitulo="var(--color-test-pass)"
      />
    </div>
  )
}

function FilaOcultos({ totales, pasados }: { readonly totales: number; readonly pasados: number }) {
  const todoOk = pasados === totales
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
