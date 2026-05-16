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
}: CodeEditorNexottProps) {
  const etiquetaLenguaje = lenguaje ? (LENGUAJE_LABEL[lenguaje] ?? lenguaje) : null
  const mostrarTab = !compacto && etiquetaLenguaje !== null
  const lang = lenguaje ?? "otro"
  const minHeight = `${Math.max(1, rows) * 1.65}em`

  return (
    <div
      className={cn(
        "group/code relative flex flex-col overflow-hidden rounded-lg border shadow-xs",
        "border-[color:var(--color-code-border)] bg-[color:var(--color-code-bg)]",
        "transition-[border-color,box-shadow] duration-base ease-default",
        readOnly ? "" : "focus-within:border-aurora-cyan focus-within:shadow-ring-aurora-cyan-soft",
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
      <Editor
        value={value}
        onValueChange={onValueChange ?? noop}
        highlight={(code) => highlightCodigo(code, lang)}
        padding={compacto ? 12 : 16}
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
  )
}

function noop(_value: string): void {
  // El editor solo-lectura ignora cambios; mantenemos la firma para no romper
  // el contrato de `react-simple-code-editor`.
}
