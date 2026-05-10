import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import Underline from "@tiptap/extension-underline"
import { type Content, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

interface UseTiptapEditorOptions {
  readonly initialContent: Content
  readonly placeholder?: string
  readonly onUpdate: (json: Content) => void
}

export function useTiptapEditor({
  initialContent,
  placeholder = "Escribe aquí…",
  onUpdate,
}: UseTiptapEditorOptions) {
  return useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        // biome-ignore lint/style/useNamingConvention: API de Tiptap
        HTMLAttributes: {
          class: "text-brand-violet underline underline-offset-2",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "tiptap-prose min-h-[160px] rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON())
    },
  })
}
