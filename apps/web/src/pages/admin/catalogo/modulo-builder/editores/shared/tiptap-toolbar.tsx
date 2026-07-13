import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Square,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from "lucide-react"
import { BotonImagen } from "./boton-imagen"
import { Boton, Separador } from "./tiptap-toolbar-boton"

type Variante = "completa" | "minima"

interface TiptapToolbarProps {
  readonly editor: Editor | null
  readonly variante?: Variante
}

export function TiptapToolbar({ editor, variante = "completa" }: TiptapToolbarProps) {
  if (!editor) {
    return null
  }
  const editorOk = editor
  const es = (n: string, attrs?: Record<string, unknown>) => editorOk.isActive(n, attrs)
  const chain = () => editorOk.chain().focus()

  function insertarLink() {
    const urlPrevia = editorOk.getAttributes("link").href as string | undefined
    const url = window.prompt("URL del enlace", urlPrevia ?? "https://")
    if (url === null) {
      return
    }
    if (url === "") {
      chain().unsetLink().run()
      return
    }
    chain().setLink({ href: url }).run()
  }

  function insertarTabla() {
    chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-surface p-1 shadow-xs">
      <Boton
        icono={Bold}
        etiqueta="Negrita"
        activo={es("bold")}
        onClick={() => chain().toggleBold().run()}
      />
      <Boton
        icono={Italic}
        etiqueta="Cursiva"
        activo={es("italic")}
        onClick={() => chain().toggleItalic().run()}
      />
      <Boton
        icono={UnderlineIcon}
        etiqueta="Subrayado"
        activo={es("underline")}
        onClick={() => chain().toggleUnderline().run()}
      />
      {variante === "completa" ? (
        <>
          <Separador />
          <Boton
            icono={Heading2}
            etiqueta="Título"
            activo={es("heading", { level: 2 })}
            onClick={() => chain().toggleHeading({ level: 2 }).run()}
          />
          <Boton
            icono={Heading3}
            etiqueta="Subtítulo"
            activo={es("heading", { level: 3 })}
            onClick={() => chain().toggleHeading({ level: 3 }).run()}
          />
        </>
      ) : null}
      <Separador />
      <Boton
        icono={List}
        etiqueta="Lista con viñetas"
        activo={es("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      />
      <Boton
        icono={ListOrdered}
        etiqueta="Lista numerada"
        activo={es("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      />
      {variante === "completa" ? (
        <Boton
          icono={Square}
          etiqueta="Lista de tareas"
          activo={es("taskList")}
          onClick={() => chain().toggleTaskList().run()}
        />
      ) : null}
      <Separador />
      <Boton
        icono={Code}
        etiqueta="Código inline"
        activo={es("code")}
        onClick={() => chain().toggleCode().run()}
      />
      {variante === "completa" ? (
        <>
          <Boton
            icono={Quote}
            etiqueta="Cita"
            activo={es("blockquote")}
            onClick={() => chain().toggleBlockquote().run()}
          />
          <Boton
            icono={Minus}
            etiqueta="Bloque de código"
            activo={es("codeBlock")}
            onClick={() => chain().toggleCodeBlock().run()}
          />
        </>
      ) : null}
      <Separador />
      <Boton icono={LinkIcon} etiqueta="Enlace" activo={es("link")} onClick={insertarLink} />
      {variante === "completa" ? (
        <>
          <BotonImagen editor={editorOk} />
          <Boton icono={TableIcon} etiqueta="Tabla" activo={es("table")} onClick={insertarTabla} />
        </>
      ) : null}
    </div>
  )
}
