import { InspectorRow } from "@/shared/ui/patterns/immersive/inspector"
import { type Content, EditorContent } from "@tiptap/react"
import { useState } from "react"
import { useDebouncedSave } from "../../hooks/use-debounced-save"
import "./tiptap/tiptap-content.css"
import { TiptapToolbar } from "./tiptap/tiptap-toolbar"
import { useTiptapEditor } from "./tiptap/use-tiptap-editor"
import type { BloqueEditorProps } from "./types"

const EMPTY_DOC: Content = { type: "doc", content: [{ type: "paragraph" }] }

function readContent(payload: unknown): Content {
  if (!payload || typeof payload !== "object") {
    return EMPTY_DOC
  }
  const candidate = (payload as { contenidoTiptap?: unknown }).contenidoTiptap
  if (
    candidate &&
    typeof candidate === "object" &&
    (candidate as { type?: unknown }).type === "doc"
  ) {
    return candidate as Content
  }
  return EMPTY_DOC
}

export function ParrafoEditor({ bloque, onSave }: BloqueEditorProps) {
  const [draft, setDraft] = useState<Content>(() => readContent(bloque.payload))

  useDebouncedSave(draft, (value) => {
    onSave({ payload: { contenidoTiptap: value } })
  })

  const editor = useTiptapEditor({
    initialContent: draft,
    placeholder: "Escribe el contenido del párrafo…",
    onUpdate: setDraft,
  })

  return (
    <InspectorRow label="Texto" hint="Auto-guardado al pausar la escritura">
      <div className="flex flex-col gap-2">
        <TiptapToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </InspectorRow>
  )
}
