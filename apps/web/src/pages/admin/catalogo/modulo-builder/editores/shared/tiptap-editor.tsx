import { cn } from "@/shared/lib/cn"
import { type AnyExtension, type Editor, EditorContent, useEditor } from "@tiptap/react"
import { useEffect } from "react"
import { TiptapToolbar } from "./tiptap-toolbar"

type ExtensionLista = readonly AnyExtension[]

interface TiptapEditorProps {
  readonly htmlInicial: string
  readonly extensiones: ExtensionLista
  readonly variante?: "completa" | "minima"
  readonly altoMin?: string
  readonly onCambio: (html: string, textoPlano: string) => void
  readonly onEditorReady?: (editor: Editor) => void
}

/**
 * Editor Tiptap reutilizable. El padre define las extensiones segun el tipo
 * de bloque (PARRAFO usa completas, TIP minimas). Emite `onCambio` en cada
 * tecla — el padre se ocupa del debounce / autoguardado.
 */
export function TiptapEditor({
  htmlInicial,
  extensiones,
  variante = "completa",
  altoMin = "320px",
  onCambio,
  onEditorReady,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [...extensiones],
    content: htmlInicial,
    onUpdate: ({ editor }) => {
      onCambio(editor.getHTML(), editor.getText())
    },
    editorProps: {
      attributes: {
        class: cn("tiptap focus:outline-none", "text-body text-text-primary"),
      },
    },
  })

  // Si cambia el bloque seleccionado (cambia htmlInicial entre renders), sincronizamos
  useEffect(() => {
    if (!editor) {
      return
    }
    if (editor.getHTML() !== htmlInicial) {
      editor.commands.setContent(htmlInicial, { emitUpdate: false })
    }
  }, [editor, htmlInicial])

  // Exponer el editor al padre cuando esté listo
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  return (
    <div className="flex flex-col gap-3">
      <TiptapToolbar editor={editor} variante={variante} />
      <div
        className={cn(
          "rounded-lg border border-border-strong bg-surface px-5 py-4 shadow-xs",
          "transition-[border-color,box-shadow] duration-base ease-default",
          "focus-within:border-aurora-violet focus-within:shadow-ring-aurora-soft",
        )}
        style={{ minHeight: altoMin }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
