import { cn } from "@/shared/lib/cn"
import type { TiptapJSONDoc } from "@nexott-learn/shared-types"
import { EditorContent, useEditor } from "@tiptap/react"
import { READER_EXTENSIONS_F2 } from "../lib/tiptap-extensions"
import { proseInmersivo } from "./prose-inmersivo"

interface TiptapReaderProps {
  readonly doc: TiptapJSONDoc
}

export function TiptapReader({ doc }: TiptapReaderProps) {
  const editor = useEditor({
    editable: false,
    extensions: READER_EXTENSIONS_F2,
    content: doc,
  })

  if (!editor) {
    return <div className="h-24 animate-pulse rounded-xl bg-glass-1" />
  }

  return <EditorContent editor={editor} className={cn("text-text-primary", proseInmersivo)} />
}

export default TiptapReader
