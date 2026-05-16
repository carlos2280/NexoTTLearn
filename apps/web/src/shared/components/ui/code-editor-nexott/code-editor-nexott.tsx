import { cn } from "@/shared/lib/cn"
import Editor from "react-simple-code-editor"
import { LENGUAJE_LABEL, highlightCodigo } from "./prism-config"

interface CodeEditorNexottProps {
  readonly value: string
  readonly onValueChange?: (value: string) => void
  /** ID del lenguaje (typescript, python, etc.) para tab superior y syntax highlight. */
  readonly lenguaje?: string
  /** Compacto: sin tab superior y con menos padding (para tests cortos, entrada/salida). */
  readonly compacto?: boolean
  /** Aproximado: define min-height en líneas. */
  readonly rows?: number
  readonly placeholder?: string
  readonly id?: string
  readonly className?: string
  /**
   * Modo solo-lectura. El textarea sigue siendo navegable y seleccionable
   * (importante para que el participante pueda copiar el snippet), pero no
   * se aceptan ediciones. Si está activo, `onValueChange` es ignorado.
   */
  readonly readOnly?: boolean
  /**
   * Muestra un gutter de números de línea a la izquierda del editor.
   * Usado en retos de código (CODIGO_PREGUNTAS) para alinear con el
   * "look IDE" que el participante espera. Por defecto desactivado para no
   * añadir ruido en CODIGO_ILUSTRATIVO ni en editores compactos del admin.
   */
  readonly mostrarNumerosLinea?: boolean
  /**
   * Embebido: el editor está dentro de un contenedor mayor que ya provee
   * el frame (borde, radius, sombra, tab del lenguaje). En este modo el
   * editor se vuelve "plano": sin radius, sin borde, sin tab del lenguaje,
   * sin sombra. Pensado para el reto CODIGO_PREGUNTAS donde el IDE-frame
   * externo agrupa top-bar + editor + terminal en una sola pieza.
   */
  readonly embedded?: boolean
}

/**
 * Editor de código con look IDE moderno + syntax highlighting (Prism).
 *
 * Características técnicas:
 *   - `react-simple-code-editor` superpone un textarea transparente sobre
 *     un `<pre>` coloreado por Prism, manteniendo edición real.
 *   - Surface oscuro `--color-code-bg` (#0b1020 deep IDE).
 *   - Tokens de Prism mapeados a `--color-syntax-*` en globals.css —
 *     "syntax con tinta de marca" del manifiesto.
 *   - Caret `--color-code-cursor` (índigo claro).
 *   - Halo aurora-cyan al focus (firma técnica NexoTT).
 *   - Tab superior con dot aurora-cyan + nombre del lenguaje.
 *   - Indentación con Tab (2 espacios, manejado por react-simple-code-editor).
 *   - Soporta `readOnly`: el participante puede copiar pero no editar.
 *
 * **Por qué Prism y no CodeMirror 6**: el editor ya estaba montado en el
 * admin con tema NexoTT calibrado (D-VISUAL). Reutilizar evita 150 KB y
 * mantiene consistencia visual entre admin y participante. Si Sub-capa C
 * pide autocompletado / linting en `CODIGO_PREGUNTAS`, migramos a CM6 ahí.
 */
export function CodeEditorNexott({
  value,
  onValueChange,
  lenguaje,
  compacto = false,
  rows = 10,
  placeholder,
  id,
  className,
  readOnly = false,
  mostrarNumerosLinea = false,
  embedded = false,
}: CodeEditorNexottProps) {
  const etiquetaLenguaje = lenguaje ? (LENGUAJE_LABEL[lenguaje] ?? lenguaje) : null
  const mostrarTab = !(embedded || compacto) && etiquetaLenguaje !== null
  const lang = lenguaje ?? "otro"
  const minHeight = `${Math.max(1, rows) * 1.65}em`
  const padding = compacto ? 12 : 16

  return (
    <div
      className={cn(
        "group/code relative flex flex-col overflow-hidden",
        embedded ? "" : "rounded-lg border shadow-xs",
        "border-[color:var(--color-code-border)] bg-[color:var(--color-code-bg)]",
        "transition-[border-color,box-shadow] duration-base ease-default",
        readOnly || embedded
          ? ""
          : "focus-within:border-aurora-cyan focus-within:shadow-ring-aurora-cyan-soft",
        className,
      )}
    >
      {mostrarTab ? (
        <div className="flex items-center gap-2 border-[color:var(--color-code-border)] border-b px-3 py-1.5">
          <span
            aria-hidden={true}
            className="inline-block h-1.5 w-1.5 rounded-pill bg-aurora-cyan/70"
          />
          <span className="font-mono text-[color:var(--color-syntax-comment)] text-caption tracking-wide">
            {etiquetaLenguaje}
          </span>
          {readOnly ? (
            <span className="ml-auto font-mono text-[10px] text-[color:var(--color-syntax-comment)] uppercase tracking-wider">
              read-only
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex">
        {mostrarNumerosLinea ? <NumerosLinea valor={value} padding={padding} /> : null}
        <div className="min-w-0 flex-1">
          <Editor
            value={value}
            onValueChange={onValueChange ?? noop}
            highlight={(code) => highlightCodigo(code, lang)}
            padding={padding}
            textareaId={id}
            placeholder={placeholder}
            tabSize={2}
            insertSpaces={true}
            disabled={readOnly}
            style={{
              fontFamily:
                'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
              fontSize: 13,
              lineHeight: 1.65,
              minHeight,
              color: "var(--color-syntax-variable)",
              caretColor: readOnly ? "transparent" : "var(--color-code-cursor)",
              fontVariantLigatures: "common-ligatures",
            }}
            textareaClassName="nx-code-textarea"
          />
        </div>
      </div>
    </div>
  )
}

interface NumerosLineaProps {
  readonly valor: string
  readonly padding: number
}

/**
 * Gutter de números de línea alineado verticalmente con el textarea del
 * editor. Comparte font-size, line-height y padding-top con `<Editor>` para
 * que cada número quede a la altura exacta de su línea de código.
 *
 * `user-select: none` evita que los números se copien al hacer Ctrl+A. El
 * borde derecho es la separación visual con el código (mismo color que el
 * borde exterior del editor).
 */
function NumerosLinea({ valor, padding }: NumerosLineaProps) {
  const totalLineas = Math.max(1, valor.split("\n").length)
  return (
    <div
      aria-hidden={true}
      className="select-none border-[color:var(--color-code-border)] border-r font-mono text-[color:var(--color-code-line-number)]"
      style={{
        fontSize: 13,
        lineHeight: 1.65,
        paddingTop: padding,
        paddingBottom: padding,
        paddingLeft: 12,
        paddingRight: 10,
        textAlign: "right",
        minWidth: totalLineas >= 100 ? "3.5em" : "2.5em",
      }}
    >
      {Array.from({ length: totalLineas }, (_, i) => (
        <div key={`ln-${i + 1}`}>{i + 1}</div>
      ))}
    </div>
  )
}

function noop(_value: string): void {
  // El editor solo-lectura ignora cambios; mantenemos la firma para no romper
  // el contrato de `react-simple-code-editor`.
}
