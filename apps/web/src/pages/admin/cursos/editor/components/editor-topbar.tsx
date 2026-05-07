import { cn } from "@/shared/lib/cn"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { ArrowLeft, Command, Eye, Sparkles } from "lucide-react"
import { useSaveStatus } from "../hooks/use-save-status"
import { estadoMeta } from "../lib/estado-meta"
import { SaveIndicator } from "./save-indicator"

interface EditorTopbarProps {
  readonly curso: CursoDetalle
  readonly onBack: () => void
  readonly onPublish: () => void
}

export function EditorTopbar({ curso, onBack, onPublish }: EditorTopbarProps) {
  const meta = estadoMeta(curso.estado)
  const saveStatus = useSaveStatus()
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-sm text-text-secondary hover:bg-glass-1 hover:text-text-primary"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        <span>Cursos</span>
      </button>

      <span aria-hidden="true" className="text-text-faint">
        ·
      </span>
      <span className="text-sm text-text-muted">{curso.empresaCliente}</span>
      <span aria-hidden="true" className="text-text-faint">
        ·
      </span>
      <span className="truncate font-medium text-sm text-text-primary">{curso.titulo}</span>

      <span
        className={cn(
          "ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-[0.12em]",
          meta.classes,
        )}
      >
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full"
          style={{ background: meta.dot }}
        />
        {meta.label}
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <SaveIndicator status={saveStatus} />
        <Button variant="ghost" size="sm" disabled={true}>
          <Eye className="size-3.5" />
          Vista
        </Button>
        <Button variant="ghost" size="sm" disabled={true}>
          <Command className="size-3.5" />
          ⌘K
        </Button>
        {curso.estado === "BORRADOR" ? (
          <Button size="sm" onClick={onPublish}>
            <Sparkles className="size-3.5" />
            Publicar
          </Button>
        ) : null}
      </div>
    </>
  )
}
