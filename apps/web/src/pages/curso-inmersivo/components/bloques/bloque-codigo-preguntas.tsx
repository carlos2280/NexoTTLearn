import { Button } from "@/shared/components/ui/button"
import { CodeEditorNexott } from "@/shared/components/ui/code-editor-nexott"
import {
  type ContenidoCodigoPreguntas,
  type ContenidoCodigoTests,
  contenidoCodigoPreguntasSchema,
} from "@nexott-learn/shared-types"
import { Play, RotateCcw } from "lucide-react"
import { Cabecera } from "./codigo-preguntas/cabecera"
import { PanelEnunciado } from "./codigo-preguntas/panel-enunciado"
import { ResultadoIntento } from "./codigo-preguntas/resultado-intento"
import { TerminalTests } from "./codigo-preguntas/terminal-tests"
import { useFlujoCodigoPregunta } from "./codigo-preguntas/use-flujo-codigo-pregunta"

interface BloqueCodigoPreguntasProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly contenido: Record<string, unknown> | null
  readonly contenidoTests: ContenidoCodigoTests | null
}

const NOTA_APROBADO_DEFAULT = 60

const NOMBRE_ARCHIVO_POR_LENGUAJE: Record<string, string> = {
  javascript: "solucion.js",
  typescript: "solucion.ts",
  python: "solucion.py",
  java: "Solucion.java",
  bash: "solucion.sh",
  html: "solucion.html",
}

function nombreArchivo(lenguaje: string): string {
  return NOMBRE_ARCHIVO_POR_LENGUAJE[lenguaje] ?? "solucion.txt"
}

/**
 * Bloque CODIGO_PREGUNTAS — reto de código.
 *
 *  - Layout vertical: enunciado arriba (ancho completo) + frame IDE
 *    abajo (top bar tipo VSCode + editor + terminal integrada).
 *  - Siempre auto-corregible: el bloque exige un `CODIGO_TESTS` hermano con
 *    pares stdin/stdout. El runner ejecuta los tests en el navegador
 *    (Pyodide / Web Worker) y persiste el intento con la nota recalculada.
 *  - Si la sección está mal configurada (sin `CODIGO_TESTS` hermano) el
 *    botón queda deshabilitado; el admin debe arreglarlo desde el builder.
 */
export function BloqueCodigoPreguntas({
  bloqueId,
  cursoId,
  contenido,
  contenidoTests,
}: BloqueCodigoPreguntasProps) {
  const parsed = contenidoCodigoPreguntasSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  return (
    <RetoActivo
      bloqueId={bloqueId}
      cursoId={cursoId}
      contenido={parsed.data}
      contenidoTests={contenidoTests}
    />
  )
}

interface RetoActivoProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly contenido: ContenidoCodigoPreguntas
  readonly contenidoTests: ContenidoCodigoTests | null
}

function RetoActivo({ bloqueId, cursoId, contenido, contenidoTests }: RetoActivoProps) {
  const flujo = useFlujoCodigoPregunta({ bloqueId, cursoId, contenido, contenidoTests })
  const isPending = flujo.isEjecutando || flujo.isEnviando
  const puedeReset = !isPending && flujo.codigo !== contenido.esqueletoInicial
  const archivo = nombreArchivo(contenido.lenguaje)

  return (
    <article className="flex flex-col gap-5">
      <Cabecera lenguaje={contenido.lenguaje} />
      <PanelEnunciado contenido={contenido} />
      <div
        className="overflow-hidden rounded-2xl border border-border-strong bg-surface"
        style={{ boxShadow: "var(--shadow-card-resting)" }}
      >
        <TopBarIde
          archivo={archivo}
          lenguaje={contenido.lenguaje}
          onEjecutar={flujo.ejecutar}
          puedeEjecutar={Boolean(
            flujo.puedeEjecutar && !isPending && flujo.codigo.trim().length > 0,
          )}
          isEjecutando={flujo.isEjecutando}
          isEnviando={flujo.isEnviando}
        />
        <CodeEditorNexott
          value={flujo.codigo}
          onValueChange={flujo.setCodigo}
          lenguaje={contenido.lenguaje}
          rows={Math.max(10, contenido.esqueletoInicial.split("\n").length + 2)}
          placeholder="Escribe tu solución…"
          mostrarNumerosLinea={true}
        />
        <div className="flex items-center justify-end border-border border-t bg-subtle px-3 py-1.5">
          <Button variant="ghost" size="sm" onClick={flujo.reset} disabled={!puedeReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden={true} />
            Restaurar esqueleto
          </Button>
        </div>
        <TerminalTests ejecucion={flujo.ejecucion} isEjecutando={flujo.isEjecutando} />
      </div>
      {flujo.errorEjecucion ? (
        <aside className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-body-sm text-danger-on-soft">
          No pudimos ejecutar los tests en el navegador: {flujo.errorEjecucion.message}
        </aside>
      ) : null}
      {flujo.ultimoIntento ? (
        <ResultadoIntento intento={flujo.ultimoIntento} notaAprobado={NOTA_APROBADO_DEFAULT} />
      ) : null}
    </article>
  )
}

interface TopBarIdeProps {
  readonly archivo: string
  readonly lenguaje: string
  readonly onEjecutar: () => void
  readonly puedeEjecutar: boolean
  readonly isEjecutando: boolean
  readonly isEnviando: boolean
}

function TopBarIde({
  archivo,
  lenguaje,
  onEjecutar,
  puedeEjecutar,
  isEjecutando,
  isEnviando,
}: TopBarIdeProps) {
  return (
    <div className="flex items-center justify-between border-border border-b bg-subtle px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" aria-hidden={true}>
          <span className="h-2.5 w-2.5 rounded-pill bg-state-no-apto" />
          <span className="h-2.5 w-2.5 rounded-pill bg-warmth" />
          <span className="h-2.5 w-2.5 rounded-pill bg-state-solido" />
        </div>
        <span className="font-mono text-caption text-text-secondary">
          {archivo} · {lenguaje}
        </span>
      </div>
      <Button
        size="sm"
        onClick={onEjecutar}
        disabled={!puedeEjecutar}
        style={{ boxShadow: "var(--shadow-accent-glow)" }}
      >
        <Play className="mr-1.5 h-3 w-3 fill-current" aria-hidden={true} />
        {isEjecutando ? "Ejecutando…" : isEnviando ? "Guardando…" : "Ejecutar tests"}
      </Button>
    </div>
  )
}
