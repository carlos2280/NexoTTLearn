import { Check, Play, X } from "lucide-react"
import { PgSection } from "./pg-section"

const CODIGO_LINEAS: readonly string[] = [
  "def calcular_promedio(notas: list[float]) -> float:",
  '    """Devuelve el promedio simple. Lanza si la lista es vacía."""',
  "    if not notas:",
  '        raise ValueError("La lista no puede estar vacía")',
  "    return sum(notas) / len(notas)",
]

interface TestResultado {
  readonly nombre: string
  readonly estado: "pass" | "fail"
  readonly detalle?: string
}

const TESTS: readonly TestResultado[] = [
  { nombre: "calcular_promedio([10, 20, 30]) == 20", estado: "pass" },
  { nombre: "calcular_promedio([100]) == 100", estado: "pass" },
  {
    nombre: "calcular_promedio([]) lanza ValueError",
    estado: "fail",
    detalle: "esperaba ValueError, obtuvo ZeroDivisionError",
  },
]

export function PgCodeBlock() {
  return (
    <PgSection
      eyebrow="Bloque evaluable · Código con tests"
      titulo="Code playground"
      descripcion="El momento técnico del producto. Surface IDE, syntax highlighting con tinta de marca, feedback de tests con glow."
    >
      <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface">
        <div className="flex items-center justify-between border-border border-b bg-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-pill bg-state-no-apto" />
              <span className="h-2.5 w-2.5 rounded-pill bg-warmth" />
              <span className="h-2.5 w-2.5 rounded-pill bg-state-solido" />
            </div>
            <span className="font-mono text-caption text-text-secondary">
              promedio.py · skill: python.basico
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3 py-1.5 font-semibold text-caption text-white transition-all duration-base hover:bg-accent-hover"
            style={{ boxShadow: "var(--shadow-accent-glow)" }}
          >
            <Play className="h-3 w-3 fill-current" />
            Ejecutar tests
          </button>
        </div>

        <div
          className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6"
          style={{ background: "var(--color-code-bg)", color: "var(--color-code-text)" }}
        >
          {CODIGO_LINEAS.map((linea, i) => (
            <div key={linea} className="flex gap-4">
              <span
                className="w-6 shrink-0 select-none text-right"
                style={{ color: "var(--color-code-line-number)" }}
              >
                {i + 1}
              </span>
              <LineaCodigo linea={linea} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-border border-t bg-surface p-4">
          <span className="nx-eyebrow text-text-tertiary">
            Resultados · {TESTS.filter((t) => t.estado === "pass").length}/{TESTS.length} pasaron
          </span>
          {TESTS.map((t) => (
            <TestRow key={t.nombre} test={t} />
          ))}
        </div>
      </div>
    </PgSection>
  )
}

const RE_TOKEN = /("[^"]*")|(#.*$)|\b(def|return|if|not|raise|list|float)\b/g

interface Tramo {
  readonly id: string
  readonly tipo: "kw" | "st" | "cm" | "txt"
  readonly text: string
}

function tokenizar(linea: string): readonly Tramo[] {
  const tramos: Tramo[] = []
  let cursor = 0
  let idx = 0
  for (const m of linea.matchAll(RE_TOKEN)) {
    const start = m.index
    if (start > cursor) {
      tramos.push({
        id: `t${idx++}`,
        tipo: "txt",
        text: linea.slice(cursor, start),
      })
    }
    const tipo: Tramo["tipo"] = m[1] ? "st" : m[2] ? "cm" : "kw"
    tramos.push({ id: `t${idx++}`, tipo, text: m[0] })
    cursor = start + m[0].length
  }
  if (cursor < linea.length) {
    tramos.push({ id: `t${idx++}`, tipo: "txt", text: linea.slice(cursor) })
  }
  return tramos
}

const COLOR_POR_TIPO: Record<Tramo["tipo"], string | undefined> = {
  kw: "var(--color-syntax-keyword)",
  st: "var(--color-syntax-string)",
  cm: "var(--color-syntax-comment)",
  txt: undefined,
}

function LineaCodigo({ linea }: { linea: string }) {
  const tramos = tokenizar(linea)
  return (
    <span>
      {tramos.map((tramo) => (
        <span key={tramo.id} style={{ color: COLOR_POR_TIPO[tramo.tipo] }}>
          {tramo.text}
        </span>
      ))}
    </span>
  )
}

function TestRow({ test }: { test: TestResultado }) {
  const pass = test.estado === "pass"
  const Icon = pass ? Check : X
  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-3 py-2 text-body-sm"
      style={{
        borderColor: pass
          ? "rgb(var(--color-state-apto-rgb) / 0.3)"
          : "rgb(var(--color-state-no-apto-rgb) / 0.3)",
        background: pass ? "var(--color-state-apto-soft)" : "var(--color-state-no-apto-soft)",
        boxShadow: pass ? "var(--shadow-glow-test-pass)" : "var(--shadow-glow-test-fail)",
      }}
    >
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: pass ? "var(--color-test-pass)" : "var(--color-test-fail)" }}
      />
      <div className="flex flex-col gap-0.5">
        <span
          className="font-mono"
          style={{
            color: pass ? "var(--color-state-apto-on-soft)" : "var(--color-state-no-apto-on-soft)",
          }}
        >
          {test.nombre}
        </span>
        {test.detalle ? (
          <span className="text-caption" style={{ color: "var(--color-state-no-apto-on-soft)" }}>
            {test.detalle}
          </span>
        ) : null}
      </div>
    </div>
  )
}
