import type { CrearBloqueAdminInput } from "@nexott-learn/shared-types"
import { Code2, FileText, Lightbulb, Star, Video } from "lucide-react"
import type { ReactNode } from "react"

interface InsertBloqueMenuProps {
  readonly onPick: (input: CrearBloqueAdminInput) => void
  readonly onCancel: () => void
}

interface MenuItem {
  readonly label: string
  readonly hint: string
  readonly icon: ReactNode
  readonly build: () => CrearBloqueAdminInput
}

const ITEMS: readonly MenuItem[] = [
  {
    label: "Párrafo",
    hint: "Texto enriquecido",
    icon: <FileText className="size-4" />,
    build: () => ({
      tipo: "PARRAFO",
      payload: {
        contenidoTiptap: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
        },
      },
    }),
  },
  {
    label: "Tip · INFO",
    hint: "Recuadro destacado",
    icon: <Lightbulb className="size-4" />,
    build: () => ({
      tipo: "TIP",
      payload: { variante: "info", texto: "Escribe el tip aquí." },
    }),
  },
  {
    label: "Código",
    hint: "Bloque de código (solo ver)",
    icon: <Code2 className="size-4" />,
    build: () => ({
      tipo: "CODIGO",
      codigoUbicacion: "INLINE",
      codigoInteractivo: "SOLO_VER",
      codigoEvaluable: "NINGUNO",
      codigoLenguaje: "JAVASCRIPT",
      payload: { archivos: [{ nombre: "main.js", contenido: "// Escribe tu código" }] },
    }),
  },
  {
    label: "Video",
    hint: "Embed YouTube/Vimeo",
    icon: <Video className="size-4" />,
    build: () => ({
      tipo: "VIDEO",
      payload: { url: "https://", proveedor: "youtube" },
    }),
  },
  {
    label: "Quiz",
    hint: "Preguntas de selección",
    icon: <Star className="size-4" />,
    build: () => ({ tipo: "QUIZ", payload: { preguntas: [] } }),
  },
]

export function InsertBloqueMenu({ onPick, onCancel }: InsertBloqueMenuProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-glass-border-strong bg-surface-2 p-2 shadow-lg">
      <div className="flex items-center justify-between px-2 py-1">
        <p className="font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
          Insertar bloque
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-text-muted text-xs hover:text-text-primary"
        >
          Cancelar
        </button>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPick(item.build())}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left transition-colors hover:bg-glass-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-glass-1 text-text-secondary">
              {item.icon}
            </span>
            <span className="flex flex-col">
              <span className="font-medium text-sm text-text-primary">{item.label}</span>
              <span className="text-[11px] text-text-muted">{item.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
