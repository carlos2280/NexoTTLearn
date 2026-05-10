// Canonical Tiptap extension list for rich content. Shared between the
// participant reader (read-only) and the admin editor (editable). If this
// list is modified, both sides must recompile to stay in sync.

import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { Color } from "@tiptap/extension-color"
import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { Link } from "@tiptap/extension-link"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Underline } from "@tiptap/extension-underline"
import StarterKit from "@tiptap/starter-kit"
import { common, createLowlight } from "lowlight"

const lowlight = createLowlight(common)

export const READER_EXTENSIONS_F2 = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
  }),
  Underline,
  TextStyle,
  Color.configure({ types: ["textStyle"] }),
  Highlight.configure({ multicolor: true }),
  Link.configure({
    openOnClick: true,
    // biome-ignore lint/style/useNamingConvention: Tiptap public API uses HTMLAttributes verbatim.
    HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Image.configure({ inline: false, allowBase64: false }),
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Subscript,
  Superscript,
  CodeBlockLowlight.configure({ lowlight }),
]
