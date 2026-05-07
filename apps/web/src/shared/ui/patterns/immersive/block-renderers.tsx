import { cn } from "@/shared/lib/cn"
import type { BloqueDetalleAdmin, TipVariante } from "@nexott-learn/shared-types"
import {
  AlertTriangle,
  ChevronRight,
  Code2,
  FileText,
  GripVertical,
  Info,
  Lightbulb,
  Link2,
  Sparkles,
  Star,
  Video,
} from "lucide-react"
import type { ReactNode } from "react"
import type { ImmersiveMode } from "./types"

// El renderer es el corazón de la reutilización admin/participante. Cada
// tipo de bloque conoce su shape y se pinta igual en ambos contextos: lo
// único que cambia es `mode`. En modo edit aparece el handle de drag y la
// fila clickea para abrir el inspector. En modo read no hay interacciones,
// solo lectura.

interface BlockRendererProps {
  readonly bloque: BloqueDetalleAdmin
  readonly mode: ImmersiveMode
  readonly selected?: boolean
  readonly onSelect?: (id: string) => void
}

export function BlockRenderer(props: BlockRendererProps) {
  const { bloque, mode, selected, onSelect } = props
  return (
    <div
      role={mode === "edit" ? "button" : undefined}
      tabIndex={mode === "edit" ? 0 : -1}
      onClick={() => mode === "edit" && onSelect?.(bloque.id)}
      onKeyDown={(e) => {
        if (mode !== "edit") {
          return
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect?.(bloque.id)
        }
      }}
      className={cn(
        "group/block relative flex gap-2 rounded-[var(--radius-md)] border border-transparent",
        "transition-all duration-200",
        mode === "edit" && "px-1 py-1 hover:border-glass-border",
        mode === "edit" && selected && "border-brand-violet/40 bg-glass-1",
      )}
    >
      {mode === "edit" ? (
        <span
          aria-hidden="true"
          className={cn(
            "mt-2 flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-text-faint",
            "opacity-0 transition-opacity group-hover/block:opacity-100",
          )}
        >
          <GripVertical className="size-3.5" strokeWidth={2} />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <BlockBody bloque={bloque} />
      </div>
    </div>
  )
}

function BlockBody({ bloque }: { readonly bloque: BloqueDetalleAdmin }) {
  switch (bloque.tipo) {
    case "PARRAFO":
      return <ParrafoView payload={bloque.payload} />
    case "TIP":
      return <TipView payload={bloque.payload} />
    case "VIDEO":
      return <VideoView payload={bloque.payload} />
    case "RECURSO":
      return <RecursoView payload={bloque.payload} />
    case "CODIGO":
      return <CodigoView bloque={bloque} />
    case "QUIZ":
      return <QuizView payload={bloque.payload} />
    default:
      return null
  }
}

// ─── Renderers por tipo ──────────────────────────────────────────────

function ParrafoView({ payload }: { readonly payload: Record<string, unknown> }) {
  // El back guarda Tiptap JSON en `contenidoTiptap`. En este sprint
  // mostramos solo texto plano extraído (placeholder). Cuando integremos
  // Tiptap renderer real, esto se reemplaza.
  const text = extractTextFromTiptap(payload.contenidoTiptap) || "Párrafo vacío"
  return (
    <div className="prose-sm flex items-start gap-3 px-2 py-1.5">
      <FileText className="mt-1 size-4 shrink-0 text-text-faint" strokeWidth={1.5} />
      <p className="text-sm text-text-primary leading-relaxed">{text}</p>
    </div>
  )
}

const TIP_META: Record<
  TipVariante,
  {
    readonly icon: ReactNode
    readonly border: string
    readonly bg: string
    readonly label: string
    readonly accent: string
  }
> = {
  info: {
    icon: <Info className="size-4" strokeWidth={1.8} />,
    border: "border-info/30",
    bg: "bg-info/5",
    label: "INFO",
    accent: "text-info",
  },
  "best-practice": {
    icon: <Sparkles className="size-4" strokeWidth={1.8} />,
    border: "border-success/30",
    bg: "bg-success/5",
    label: "BEST PRACTICE",
    accent: "text-success",
  },
  warning: {
    icon: <AlertTriangle className="size-4" strokeWidth={1.8} />,
    border: "border-warning/30",
    bg: "bg-warning/5",
    label: "WARNING",
    accent: "text-warning",
  },
  gotcha: {
    icon: <Lightbulb className="size-4" strokeWidth={1.8} />,
    border: "border-danger/30",
    bg: "bg-danger/5",
    label: "GOTCHA",
    accent: "text-danger",
  },
}

function TipView({ payload }: { readonly payload: Record<string, unknown> }) {
  const variante = (payload.variante as TipVariante) ?? "info"
  const texto = (payload.texto as string) ?? ""
  const meta = TIP_META[variante] ?? TIP_META.info
  return (
    <div
      className={cn("flex gap-3 rounded-[var(--radius-md)] border px-4 py-3", meta.border, meta.bg)}
    >
      <span className={cn("mt-0.5 shrink-0", meta.accent)} aria-hidden="true">
        {meta.icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className={cn("font-semibold text-[10px] uppercase tracking-[0.14em]", meta.accent)}>
          {meta.label}
        </span>
        <p className="text-sm text-text-primary leading-relaxed">
          {texto || <span className="text-text-muted italic">Sin texto</span>}
        </p>
      </div>
    </div>
  )
}

function VideoView({ payload }: { readonly payload: Record<string, unknown> }) {
  const url = (payload.url as string) ?? ""
  const proveedor = (payload.proveedor as string) ?? "video"
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-glass-2 text-brand-violet-soft"
      >
        <Video className="size-4" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm text-text-primary">
          {url || <span className="text-text-muted italic">Sin URL</span>}
        </p>
        <p className="text-text-muted text-xs capitalize">{proveedor}</p>
      </div>
    </div>
  )
}

function RecursoView({ payload }: { readonly payload: Record<string, unknown> }) {
  const url = (payload.url as string) ?? ""
  const descripcion = (payload.descripcion as string) ?? ""
  const esDescarga = Boolean(payload.esDescarga)
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-glass-2 text-brand-cyan"
      >
        <Link2 className="size-4" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm text-text-primary">
          {descripcion || url || <span className="text-text-muted italic">Sin recurso</span>}
        </p>
        <p className="truncate text-text-muted text-xs">
          {esDescarga ? "Descarga" : "Enlace"} · {url}
        </p>
      </div>
    </div>
  )
}

function CodigoView({ bloque }: { readonly bloque: BloqueDetalleAdmin }) {
  const archivos = (bloque.payload.archivos as Array<{ nombre: string; contenido: string }>) ?? []
  const primero = archivos[0]
  const lenguaje = bloque.codigoLenguaje ?? "—"
  const interactivo = bloque.codigoInteractivo === "EDITABLE"
  const evaluable = bloque.codigoEvaluable && bloque.codigoEvaluable !== "NINGUNO"
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-glass-border bg-surface-2">
      <div className="flex items-center gap-2 border-glass-border border-b px-3 py-1.5 text-[11px] uppercase tracking-wider">
        <Code2 className="size-3.5 text-text-faint" strokeWidth={2} />
        <span className="text-text-secondary">{lenguaje}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <CodeChip>{interactivo ? "EDITABLE" : "SOLO VER"}</CodeChip>
          {evaluable ? <CodeChip accent={true}>{bloque.codigoEvaluable}</CodeChip> : null}
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] text-text-primary leading-relaxed">
        <code>{primero?.contenido || "// Sin código"}</code>
      </pre>
    </div>
  )
}

function CodeChip({
  children,
  accent,
}: { readonly children: ReactNode; readonly accent?: boolean }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-semibold text-[9px] tracking-[0.08em]",
        accent ? "bg-brand-violet/20 text-brand-violet-soft" : "bg-glass-2 text-text-muted",
      )}
    >
      {children}
    </span>
  )
}

function QuizView({ payload }: { readonly payload: Record<string, unknown> }) {
  const preguntas = (payload.preguntas as readonly unknown[]) ?? []
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--gradient-brand-soft)] text-brand-violet-soft"
      >
        <Star className="size-4" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-text-primary">Quiz</p>
        <p className="text-text-muted text-xs">{preguntas.length} preguntas</p>
      </div>
      <ChevronRight className="size-4 text-text-faint" strokeWidth={1.5} />
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────

function extractTextFromTiptap(input: unknown): string {
  if (!input || typeof input !== "object") {
    return ""
  }
  const node = input as { content?: unknown; text?: unknown; type?: unknown }
  if (typeof node.text === "string") {
    return node.text
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromTiptap).filter(Boolean).join(" ")
  }
  return ""
}
