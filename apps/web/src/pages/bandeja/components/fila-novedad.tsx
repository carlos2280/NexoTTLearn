import { useMarcarNotificacionLeida } from "@/features/notificaciones/hooks/use-marcar-leida"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/cn"

interface FilaNovedadProps {
  readonly notificacionId: string
  readonly texto: string
  readonly ctaLabel: "Abrir" | "Ver"
  readonly tiempoTexto: string
  readonly esCritico: boolean
}

export function FilaNovedad({
  notificacionId,
  texto,
  ctaLabel,
  tiempoTexto,
  esCritico,
}: FilaNovedadProps) {
  const marcar = useMarcarNotificacionLeida()

  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors duration-fast ease-default hover:bg-subtle">
      <span
        aria-hidden={true}
        className={cn(
          "inline-block h-2 w-2 shrink-0 rounded-pill",
          esCritico ? "bg-danger" : "bg-text-tertiary",
        )}
      />
      <p className="min-w-0 flex-1 truncate text-body-sm text-text-primary">{texto}</p>
      <span className="shrink-0 text-caption text-text-tertiary">{tiempoTexto}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => marcar.mutate(notificacionId)}
        disabled={marcar.isPending}
      >
        {ctaLabel}
      </Button>
    </li>
  )
}
