import { useCursos } from "@/features/admin-cursos/hooks/use-cursos"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import { Content, Item, Portal, Root, Trigger } from "@radix-ui/react-dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface SelectorCursoProps {
  readonly cursoIdActual: string
}

export function SelectorCurso({ cursoIdActual }: SelectorCursoProps) {
  const navigate = useNavigate()
  const { data, isLoading } = useCursos({ estado: "ACTIVO", pageSize: 50 })
  const cursos = data?.items ?? []
  const actual = cursos.find((c) => c.id === cursoIdActual)

  const cambiar = (id: string) => {
    if (id !== cursoIdActual) {
      navigate(`${RUTAS.admin.seguimiento}?curso=${id}`)
    }
  }

  return (
    <Root>
      <Trigger asChild={true}>
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-md)]",
            "border border-glass-border bg-surface-1 px-4 py-2.5",
            "text-left transition-colors hover:bg-surface-2",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
            "min-w-[280px]",
          )}
        >
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="font-semibold text-sm text-text-primary leading-tight">
              {actual?.titulo ?? (isLoading ? "Cargando…" : "Selecciona curso")}
            </span>
            <span className="text-text-muted text-xs">
              {actual?.empresaCliente ?? ""}
              {actual?.estado ? ` · ${actual.estado}` : ""}
            </span>
          </div>
          <ChevronDown className="size-4 text-text-secondary" strokeWidth={2} />
        </button>
      </Trigger>

      <Portal>
        <Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-[var(--z-modal)] min-w-[320px]",
            "overflow-hidden rounded-[var(--radius-md)]",
            "border border-glass-border-strong bg-surface-2 shadow-[var(--shadow-lg)]",
            "data-[state=open]:animate-[fade-in_120ms_ease-out]",
          )}
        >
          <div className="border-glass-border border-b px-3 py-2 font-medium text-text-muted text-xs uppercase tracking-wider">
            Cursos activos · {cursos.length}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {cursos.map((c) => {
              const seleccionado = c.id === cursoIdActual
              return (
                <Item
                  key={c.id}
                  onSelect={() => cambiar(c.id)}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 px-3 py-2.5",
                    "text-sm outline-none transition-colors",
                    "data-[highlighted]:bg-glass-2",
                    seleccionado && "bg-[var(--brand-violet)]/10",
                  )}
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                    {seleccionado && (
                      <Check className="size-4 text-brand-violet" strokeWidth={2.5} />
                    )}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium text-text-primary">{c.titulo}</span>
                    <span className="text-text-muted text-xs">{c.empresaCliente}</span>
                  </span>
                </Item>
              )
            })}
          </div>
        </Content>
      </Portal>
    </Root>
  )
}
