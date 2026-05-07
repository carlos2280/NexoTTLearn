import {
  useChecklistCacheado,
  usePublicarCurso,
} from "@/features/admin-cursos/hooks/use-editor-curso"
import { cn } from "@/shared/lib/cn"
import type { ModuloListAdminResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, CircleX, Loader2, RefreshCw, X } from "lucide-react"
import { type ReactNode, useEffect, useRef } from "react"
import { resolveChecklistCtaTarget } from "../lib/checklist-cta-target"
import { useEditorStore } from "../use-editor-store"
import { ChecklistOverlayItem } from "./checklist-overlay-item"

interface ChecklistOverlayProps {
  readonly cursoId: string
  readonly modulos: ModuloListAdminResponse | undefined
  readonly seccionesPorModulo: ReadonlyMap<string, ReadonlyArray<{ readonly id: string }>>
}

export function ChecklistOverlay({ cursoId, modulos, seccionesPorModulo }: ChecklistOverlayProps) {
  const open = useEditorStore((s) => s.isChecklistOpen)
  const close = useEditorStore((s) => s.closeChecklist)
  const setSelected = useEditorStore((s) => s.setSelected)

  const checklist = useChecklistCacheado(cursoId)
  const publicar = usePublicarCurso(cursoId)
  const ref = useRef<HTMLDivElement>(null)

  // Verificacion al abrir si aun no hay cache. La mutacion ya pobla la cache
  // (setQueryData en onSuccess) y cualquier publicacion exitosa cambia el
  // estado del curso (la UI se reconfigura sola por invalidate).
  useEffect(() => {
    if (open && !checklist && !publicar.isPending) {
      publicar.mutate()
    }
  }, [open, checklist, publicar])

  useEffect(() => {
    if (!open) {
      return
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close()
      }
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open, close])

  if (!open) {
    return null
  }

  return (
    <aside
      ref={ref}
      aria-label="Checklist de publicacion"
      className={cn(
        "fixed top-[88px] right-4 z-[var(--z-modal)] w-[22rem] max-w-[calc(100vw-2rem)]",
        "overflow-hidden rounded-[var(--radius-lg)] border border-glass-border",
        "bg-surface-1/95 shadow-2xl backdrop-blur-2xl",
      )}
    >
      <header className="flex items-center justify-between border-glass-border border-b px-4 py-3">
        <span className="font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
          Checklist de publicación
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => publicar.mutate()}
            disabled={publicar.isPending}
            className="rounded-[var(--radius-sm)] p-1 text-text-muted hover:bg-glass-1 hover:text-text-primary disabled:opacity-50"
            aria-label="Re-verificar"
          >
            <RefreshCw
              className={cn("size-3.5", publicar.isPending && "animate-spin")}
              strokeWidth={2}
            />
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-[var(--radius-sm)] p-1 text-text-muted hover:bg-glass-1 hover:text-text-primary"
            aria-label="Cerrar"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
        {publicar.isPending && !checklist ? (
          <div className="flex items-center gap-2 px-2 py-6 text-sm text-text-muted">
            <Loader2 className="size-4 animate-spin text-brand-violet-soft" strokeWidth={2} />
            Verificando checklist…
          </div>
        ) : null}

        {checklist?.caso === "A_FALTANTES" ? (
          <div className="flex flex-col gap-3">
            <Group
              icon={<CircleX className="size-3.5 text-warning" strokeWidth={2} />}
              title={`Faltantes (${checklist.faltantes.length})`}
            >
              {checklist.faltantes.map((item) => (
                <ChecklistOverlayItem
                  key={item.id}
                  item={item}
                  onGoTo={(target) => {
                    setSelected(resolveChecklistCtaTarget({ target, modulos, seccionesPorModulo }))
                    close()
                  }}
                />
              ))}
            </Group>
            {checklist.cumplidos.length > 0 ? (
              <Group
                icon={<CheckCircle2 className="size-3.5 text-success" strokeWidth={2} />}
                title={`Cumplidos (${checklist.cumplidos.length})`}
              >
                {checklist.cumplidos.map((item) => (
                  <ChecklistOverlayItem key={item.id} item={item} />
                ))}
              </Group>
            ) : null}
          </div>
        ) : null}

        {checklist?.caso === "B_OK" ? (
          <p className="px-2 py-4 text-sm text-text-secondary">
            Todos los requisitos están cumplidos. El curso ya pasó a ACTIVO.
          </p>
        ) : null}
      </div>
    </aside>
  )
}

function Group({
  icon,
  title,
  children,
}: {
  readonly icon: ReactNode
  readonly title: string
  readonly children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <header className="flex items-center gap-1.5 px-1 text-text-muted text-xs">
        {icon}
        <span className="font-medium">{title}</span>
      </header>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  )
}
