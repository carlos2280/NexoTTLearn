// TODO: este archivo tiene 203 líneas (límite del proyecto: 150). Reducir extrayendo
// la lista de botones a un array de config (label/icon/isActive/onClick) para
// renderizar en un .map. Pendiente cuando cierre Chunk 4.
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
  ListTodo,
  Minus,
  Quote,
  Redo2,
  Square,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react"
import { type ReactNode, useState } from "react"
import { TiptapLinkModal } from "./tiptap-link-modal"

interface TiptapToolbarProps {
  readonly editor: Editor | null
}

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false)

  if (!editor) {
    return null
  }

  const openLinkModal = () => {
    setLinkOpen(true)
  }

  const applyLink = (url: string | null) => {
    setLinkOpen(false)
    if (url === null) {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const currentLink = (editor.getAttributes("link").href as string | undefined) ?? ""

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 rounded-[var(--radius-sm)] border border-glass-border bg-glass-2 p-1">
        <Btn
          label="Negrita"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </Btn>
        <Btn
          label="Cursiva"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </Btn>
        <Btn
          label="Subrayado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </Btn>
        <Btn
          label="Tachado"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-3.5" />
        </Btn>
        <Btn
          label="Código inline"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-3.5" />
        </Btn>
        <Btn label="Enlace" active={editor.isActive("link")} onClick={openLinkModal}>
          <LinkIcon className="size-3.5" />
        </Btn>
        <Sep />
        <Btn
          label="Título 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-3.5" />
        </Btn>
        <Btn
          label="Título 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-3.5" />
        </Btn>
        <Btn
          label="Cita"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-3.5" />
        </Btn>
        <Btn
          label="Bloque de código"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Square className="size-3.5" />
        </Btn>
        <Sep />
        <Btn
          label="Lista"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </Btn>
        <Btn
          label="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </Btn>
        <Btn
          label="Tareas"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListTodo className="size-3.5" />
        </Btn>
        <Sep />
        <Btn
          label="Línea horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-3.5" />
        </Btn>
        <Btn
          label="Deshacer"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-3.5" />
        </Btn>
        <Btn
          label="Rehacer"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-3.5" />
        </Btn>
      </div>
      <TiptapLinkModal
        open={linkOpen}
        initialUrl={currentLink}
        onClose={() => setLinkOpen(false)}
        onApply={applyLink}
      />
    </>
  )
}

interface BtnProps {
  readonly label: string
  readonly active?: boolean
  readonly disabled?: boolean
  readonly onClick: () => void
  readonly children: ReactNode
}

function Btn({ label, active, disabled, onClick, children }: BtnProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-7 items-center justify-center rounded-[var(--radius-xs)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-brand-violet/20 text-brand-violet"
          : "text-text-secondary hover:bg-glass-1 hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px bg-glass-border" />
}
