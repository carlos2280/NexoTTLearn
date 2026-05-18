import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { Button } from "@/shared/components/ui/button"
import { CodeEditorNexott } from "@/shared/components/ui/code-editor-nexott"
import { cn } from "@/shared/lib/cn"
import {
  type ContenidoCodigoPreguntas,
  type ContenidoCodigoTests,
  type IntentoBloqueResponse,
  contenidoCodigoPreguntasSchema,
} from "@nexott-learn/shared-types"
import { Play, RotateCcw, Send } from "lucide-react"
import { useState } from "react"
import { Cabecera } from "./codigo-preguntas/cabecera"
import { PanelEnunciado } from "./codigo-preguntas/panel-enunciado"
import { ResultadoIntento } from "./codigo-preguntas/resultado-intento"
import { TerminalTests } from "./codigo-preguntas/terminal-tests"
import { useFlujoCodigoPregunta } from "./codigo-preguntas/use-flujo-codigo-pregunta"

interface BloqueCodigoPreguntasProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string | null
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
 * Estado visual del editor para el dot del top-bar:
 *  - `virgen`: el participante no ha tocado el esqueleto (gris).
 *  - `paso`: la última ejecución pasó todos los tests y el código no ha
 *    cambiado desde entonces (verde).
 *  - `pendiente`: hay cambios sin probar, o la última ejecución tuvo fallos
 *    (ámbar — invita a iterar).
 */
type EstadoEditor = "virgen" | "paso" | "pendiente"

function derivarEstadoEditor(input: {
  readonly codigo: string
  readonly esqueletoInicial: string
  readonly ejecucion: { readonly testsPasados: number; readonly testsTotales: number } | null
  readonly codigoEjecutado: string | null
}): EstadoEditor {
  if (input.codigo === input.esqueletoInicial && input.codigoEjecutado === null) {
    return "virgen"
  }
  if (
    input.ejecucion !== null &&
    input.codigoEjecutado === input.codigo &&
    input.ejecucion.testsPasados === input.ejecucion.testsTotales
  ) {
    return "paso"
  }
  return "pendiente"
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
  colaboradorId,
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
      colaboradorId={colaboradorId}
      contenido={parsed.data}
      contenidoTests={contenidoTests}
    />
  )
}

interface RetoActivoProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string | null
  readonly contenido: ContenidoCodigoPreguntas
  readonly contenidoTests: ContenidoCodigoTests | null
}

function RetoActivo({
  bloqueId,
  cursoId,
  colaboradorId,
  contenido,
  contenidoTests,
}: RetoActivoProps) {
  const flujo = useFlujoCodigoPregunta({ bloqueId, cursoId, contenido, contenidoTests })
  const mejor = useMejorIntentoBloque({
    colaboradorId: colaboradorId ?? undefined,
    bloqueId,
  })
  const [mejorPrevioAlEnviar, setMejorPrevioAlEnviar] = useState<IntentoBloqueResponse | null>(null)
  const onEnviar = (): void => {
    setMejorPrevioAlEnviar(mejor.data ?? null)
    flujo.enviar()
  }
  const isPending = flujo.isEjecutando || flujo.isEnviando
  const puedeReset = !isPending && flujo.codigo !== contenido.esqueletoInicial
  const tieneCodigo = flujo.codigo.trim().length > 0
  const puedeAccionar = Boolean(flujo.puedeEjecutar && !isPending && tieneCodigo)
  const todosLosTestsPasaron = Boolean(
    flujo.ejecucion && flujo.ejecucion.testsPasados === flujo.ejecucion.testsTotales,
  )
  const estadoEditor = derivarEstadoEditor({
    codigo: flujo.codigo,
    esqueletoInicial: contenido.esqueletoInicial,
    ejecucion: flujo.ejecucion,
    codigoEjecutado: flujo.codigoEjecutado,
  })
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
          estado={estadoEditor}
          onEjecutar={flujo.ejecutar}
          puedeEjecutar={puedeAccionar}
          isEjecutando={flujo.isEjecutando}
        />
        <CodeEditorNexott
          value={flujo.codigo}
          onValueChange={flujo.setCodigo}
          lenguaje={contenido.lenguaje}
          rows={Math.max(10, contenido.esqueletoInicial.split("\n").length + 2)}
          placeholder="Escribe tu solución…"
          mostrarNumerosLinea={true}
          embedded={true}
        />
        <div className="flex items-center justify-between gap-3 border-border border-t bg-subtle px-3 py-2">
          <Button variant="ghost" size="sm" onClick={flujo.reset} disabled={!puedeReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden={true} />
            Restaurar esqueleto
          </Button>
          <div className="flex items-center gap-3">
            <p className="hidden text-body-sm text-text-tertiary sm:block">
              Solo se guarda tu mejor intento.
            </p>
            <Button
              size="sm"
              variant={todosLosTestsPasaron ? "aurora" : "primary"}
              onClick={onEnviar}
              disabled={!puedeAccionar}
            >
              <Send className="mr-1.5 h-3 w-3" aria-hidden={true} />
              {flujo.isEnviando ? "Enviando…" : "Enviar intento"}
            </Button>
          </div>
        </div>
        <TerminalTests ejecucion={flujo.ejecucion} isEjecutando={flujo.isEjecutando} />
      </div>
      {flujo.errorEjecucion ? (
        <aside className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-body-sm text-danger-on-soft">
          No pudimos ejecutar los tests en el navegador: {flujo.errorEjecucion.message}
        </aside>
      ) : null}
      {flujo.ultimoIntento ? (
        <ResultadoIntento
          intento={flujo.ultimoIntento}
          notaAprobado={NOTA_APROBADO_DEFAULT}
          mejorPrevio={mejorPrevioAlEnviar}
        />
      ) : null}
    </article>
  )
}

interface TopBarIdeProps {
  readonly archivo: string
  readonly lenguaje: string
  readonly estado: EstadoEditor
  readonly onEjecutar: () => void
  readonly puedeEjecutar: boolean
  readonly isEjecutando: boolean
}

function TopBarIde({
  archivo,
  lenguaje,
  estado,
  onEjecutar,
  puedeEjecutar,
  isEjecutando,
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
        <DotEstado estado={estado} />
      </div>
      <Button size="sm" variant="secondary" onClick={onEjecutar} disabled={!puedeEjecutar}>
        <Play className="mr-1.5 h-3 w-3 fill-current" aria-hidden={true} />
        {isEjecutando ? "Ejecutando…" : "Ejecutar tests"}
      </Button>
    </div>
  )
}

interface DotEstadoProps {
  readonly estado: EstadoEditor
}

const DOT_ESTADO: Record<EstadoEditor, { readonly cls: string; readonly label: string }> = {
  virgen: { cls: "bg-border-strong", label: "Editor sin tocar" },
  paso: { cls: "bg-state-solido", label: "Última ejecución: todos los tests pasaron" },
  pendiente: {
    cls: "bg-warmth",
    label: "Tienes cambios sin probar o tests con fallos",
  },
}

function DotEstado({ estado }: DotEstadoProps) {
  const { cls, label } = DOT_ESTADO[estado]
  return (
    <span
      className={cn("ml-1 inline-block h-1.5 w-1.5 rounded-pill", cls)}
      title={label}
      aria-label={label}
    />
  )
}
