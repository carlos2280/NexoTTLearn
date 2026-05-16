import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { Image } from "@tiptap/extension-image"
import { Link } from "@tiptap/extension-link"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
import { Underline } from "@tiptap/extension-underline"
import { StarterKit } from "@tiptap/starter-kit"
import { common, createLowlight } from "lowlight"

const lowlight = createLowlight(common)

// Regex en top level para cumplir lint/performance/useTopLevelRegex
const WHITESPACE_RE = /\s+/

const LINK_HTML_ATTRS = { class: "text-accent underline" }

export function extensionesCompletas(placeholder: string) {
  return [
    StarterKit.configure({
      // Quitamos el codeBlock por defecto porque metemos el de lowlight
      codeBlock: false,
      heading: { levels: [2, 3] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      // biome-ignore lint/style/useNamingConvention: HTMLAttributes es el nombre de la prop de la API de TipTap, no se puede renombrar
      HTMLAttributes: LINK_HTML_ATTRS,
    }),
    Image,
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({ placeholder }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
  ]
}

export function extensionesMinimas(placeholder: string) {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: false,
      blockquote: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      // biome-ignore lint/style/useNamingConvention: HTMLAttributes es el nombre de la prop de la API de TipTap, no se puede renombrar
      HTMLAttributes: LINK_HTML_ATTRS,
    }),
    Placeholder.configure({ placeholder }),
  ]
}

export function calcularTiempoLecturaMin(textoPlano: string): number {
  const palabras = textoPlano.split(WHITESPACE_RE).filter((p) => p.length > 0).length
  if (palabras === 0) {
    return 0
  }
  return Math.max(1, Math.ceil(palabras / 200))
}
