import {
  type BloqueDetalleResponse,
  contenidoParrafoSchema,
  type TipoBloque,
} from "@nexott-learn/shared-types"
import type { Editor } from "@tiptap/react"
import { Clock } from "lucide-react"
import { useRef, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { IndicadorGuardado } from "./shared/indicador-guardado"
import { SlashMenu } from "./shared/slash-menu"
import { TiptapEditor } from "./shared/tiptap-editor"
import { calcularTiempoLecturaMin, extensionesCompletas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorParrafoProps {
  readonly bloque: BloqueDetalleResponse
  /**
   * Crear un bloque hermano del tipo elegido en la misma sección.
   * Si llega, se activa la detección de comando `/` al inicio de un bloque
   * vacío.
   */
  readonly onSlashCommand?: (seccionId: string, tipo: TipoBloque) => Promise<void>
}

interface BorradorParrafo {
  readonly html: string
  readonly textoPlano: string
}

/**
 * Hidrata el borrador desde `bloque.contenido`. Valida contra el schema
 * oficial (`contenidoParrafoSchema`); si el JSON persistido no cumple el
 * contrato (caso de bloques antiguos del seeder), cae al estado vacio
 * canonico para que el admin pueda reescribir sin que el editor explote.
 */
function leerInicial(contenido: Record<string, unknown> | null): BorradorParrafo {
  const result = contenidoParrafoSchema.safeParse(contenido)
  if (result.success) {
    return { html: result.data.html, textoPlano: result.data.textoPlano }
  }
  return { html: "", textoPlano: "" }
}

const REGEX_SLASH = /^\/(\w*)$/

export function EditorParrafo({ bloque, onSlashCommand }: EditorParrafoProps) {
  const meta = tipoBloqueMeta(bloque.tipo)
  const inicial = leerInicial(bloque.contenido)
  const borradorRef = useRef<BorradorParrafo>(inicial)
  const tiempoActualRef = useRef<number>(calcularTiempoLecturaMin(inicial.textoPlano))
  const editorRef = useRef<Editor | null>(null)
  const [slash, setSlash] = useState<{
    filtro: string
    posicion: { left: number; top: number }
  } | null>(null)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => {
      const { html, textoPlano } = borradorRef.current
      const tiempoLecturaMin = calcularTiempoLecturaMin(textoPlano)
      tiempoActualRef.current = tiempoLecturaMin
      return { html, textoPlano, tiempoLecturaMin }
    },
  })

  function detectarSlash(textoPlano: string) {
    if (!onSlashCommand) {
      return
    }
    const limpio = textoPlano.trim()
    const match = REGEX_SLASH.exec(limpio)
    if (match && !limpio.includes("\n") && editorRef.current) {
      const editor = editorRef.current
      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.from)
        setSlash({
          filtro: match[1] ?? "",
          posicion: { left: coords.left, top: coords.bottom },
        })
      } catch {
        // coordsAtPos puede fallar en estados raros; ignoramos
      }
    } else if (slash !== null) {
      setSlash(null)
    }
  }

  async function elegirSlash(tipo: TipoBloque) {
    if (!onSlashCommand) {
      return
    }
    setSlash(null)
    // Limpiamos el `/` del bloque actual antes de crear el hermano.
    if (editorRef.current) {
      editorRef.current.commands.clearContent()
      borradorRef.current = { html: "", textoPlano: "" }
      // Forzamos guardado inmediato del bloque actual vaciado.
      await auto.forzarGuardado()
    }
    await onSlashCommand(bloque.seccionId, tipo)
  }

  return (
    <div className="relative flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">Lectura</h2>
          <p className="max-w-xl text-body-sm text-text-secondary">
            Texto explicativo con formato. Soporta listas, citas, código resaltado, tablas e
            imágenes. {onSlashCommand ? "Escribe " : ""}
            {onSlashCommand ? (
              <kbd className="rounded border border-border bg-subtle px-1 font-mono text-caption">
                /
              </kbd>
            ) : null}
            {onSlashCommand ? " en un bloque vacío para insertar otro tipo." : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-caption text-text-tertiary">
          <IndicadorGuardado estado={auto.estado} />
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
            <span>{tiempoActualRef.current} min de lectura</span>
          </span>
        </div>
      </header>

      <div className="relative">
        <TiptapEditor
          key={bloque.id}
          htmlInicial={inicial.html}
          extensiones={extensionesCompletas(
            onSlashCommand
              ? "Escribe / para insertar un bloque, o empieza a escribir…"
              : "Empieza a escribir…",
          )}
          variante="completa"
          altoMin="360px"
          onEditorReady={(editor) => {
            editorRef.current = editor
          }}
          onCambio={(html, textoPlano) => {
            borradorRef.current = { html, textoPlano }
            auto.marcarSucio()
            detectarSlash(textoPlano)
          }}
        />
        {slash !== null ? (
          <SlashMenu
            filtro={slash.filtro}
            posicion={slash.posicion}
            onElegir={elegirSlash}
            onCerrar={() => setSlash(null)}
          />
        ) : null}
      </div>
    </div>
  )
}
