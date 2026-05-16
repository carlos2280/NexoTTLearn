import { useMarcarNotificacionLeida } from "@/features/notificaciones/hooks/use-marcar-leida"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/cn"
import type { CopyEvento } from "../lib/copy-notificacion"

interface FilaNovedadProps {
  readonly notificacionId: string
  readonly copy: CopyEvento
  readonly tiempoTexto: string
  readonly esCritico: boolean
}

const COLOR_ICONO: Record<CopyEvento["tono"], string> = {
  neutro: "text-text-tertiary",
  marca: "text-aurora-violet",
  warmth: "text-warmth",
  critico: "text-danger",
}

const COLOR_DOT: Record<CopyEvento["tono"], string> = {
  neutro: "bg-text-tertiary",
  marca: "bg-aurora-violet",
  warmth: "bg-warmth",
  critico: "bg-danger",
}

export function FilaNovedad({ notificacionId, copy, tiempoTexto, esCritico }: FilaNovedadProps) {
  const marcar = useMarcarNotificacionLeida()
  const tono = esCritico && copy.tono === "neutro" ? "critico" : copy.tono
  const Icono = copy.icono

  return (
    <li className="flex items-center gap-3 px-5 py-3 transition-colors duration-fast ease-default hover:bg-subtle">
      <span
        aria-hidden={true}
        className={cn("inline-block h-2 w-2 shrink-0 rounded-pill", COLOR_DOT[tono])}
      />
      <Icono className={cn("h-4 w-4 shrink-0", COLOR_ICONO[tono])} aria-hidden={true} />
      <p className="min-w-0 flex-1 truncate text-body-sm text-text-primary">{copy.texto}</p>
      <span className="hidden shrink-0 text-caption text-text-tertiary sm:inline">
        {tiempoTexto}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => marcar.mutate(notificacionId)}
        disabled={marcar.isPending}
      >
        {copy.cta}
      </Button>
    </li>
  )
}
