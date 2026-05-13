import { cn } from "@/shared/lib/cn"
import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  type LucideIcon,
  Minus,
  Quote,
  Square,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from "lucide-react"

type Variante = "completa" | "minima"

interface TiptapToolbarProps {
  readonly editor: Editor | null
  readonly variante?: Variante
}

interface BotonProps {
  readonly icono: LucideIcon
  readonly etiqueta: string
  readonly activo?: boolean
  readonly deshabilitado?: boolean
  readonly onClick: () => void
}

function Boton({ icono: Icono, etiqueta, activo, deshabilitado, onClick }: BotonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        activo
          ? "bg-accent-soft text-accent-on-soft"
          : "text-text-secondary hover:bg-subtle hover:text-text-primary",
      )}
    >
      <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
    </button>
  )
}

function Separador() {
  return <span aria-hidden={true} className="mx-1 h-5 w-px bg-border" />
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

  function insertarImagen() {
    const url = window.prompt("URL de la imagen", "https://")
    if (url) {
      chain().setImage({ src: url }).run()
    }
  }

  function insertarTabla() {
    chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-surface p-1">
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
          <Boton icono={ImageIcon} etiqueta="Imagen" onClick={insertarImagen} />
          <Boton icono={TableIcon} etiqueta="Tabla" activo={es("table")} onClick={insertarTabla} />
        </>
      ) : null}
    </div>
  )
}
