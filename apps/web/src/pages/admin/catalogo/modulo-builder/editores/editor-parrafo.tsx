import { Kbd } from "@/shared/components/ui/kbd"
import {
  type BloqueDetalleResponse,
  type TipoBloque,
  contenidoParrafoSchema,
} from "@nexott-learn/shared-types"
import type { Editor } from "@tiptap/react"
import { Clock } from "lucide-react"
import { useRef, useState } from "react"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
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

function leerInicial(contenido: Record<string, unknown> | null): BorradorParrafo {
  const result = contenidoParrafoSchema.safeParse(contenido)
  if (result.success) {
    return { html: result.data.html, textoPlano: result.data.textoPlano }
  }
  return { html: "", textoPlano: "" }
}

const REGEX_SLASH = /^\/(\w*)$/

export function EditorParrafo({ bloque, onSlashCommand }: EditorParrafoProps) {
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
    if (editorRef.current) {
      editorRef.current.commands.clearContent()
      borradorRef.current = { html: "", textoPlano: "" }
      await auto.forzarGuardado()
    }
    await onSlashCommand(bloque.seccionId, tipo)
  }

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Lectura"
      descripcion={
        onSlashCommand ? (
          <>
            Texto explicativo con formato. Soporta listas, citas, código resaltado, tablas e
            imágenes. Escribe <Kbd>/</Kbd> en un bloque vacío para insertar otro tipo.
          </>
        ) : (
          "Texto explicativo con formato. Soporta listas, citas, código resaltado, tablas e imágenes."
        )
      }
      estadoGuardado={auto.estado}
      meta={
        <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
          <span className="tabular font-mono">{tiempoActualRef.current} min lectura</span>
        </span>
      }
    >
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
    </EditorBloqueShell>
  )
}
