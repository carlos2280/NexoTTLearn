import { cn } from "@/shared/lib/cn"
import { AlertCircle, Check, CircleDashed, Loader2 } from "lucide-react"
import type { EstadoGuardado } from "./use-auto-guardar-bloque"

interface IndicadorGuardadoProps {
  readonly estado: EstadoGuardado
}

const META: Record<
  EstadoGuardado,
  { readonly etiqueta: string; readonly tono: string; readonly icono: typeof Check }
> = {
  limpio: { etiqueta: "Sin cambios", tono: "text-text-tertiary", icono: Check },
  pendiente: { etiqueta: "Cambios sin guardar", tono: "text-warning", icono: CircleDashed },
  guardando: { etiqueta: "Guardando…", tono: "text-text-secondary", icono: Loader2 },
  guardado: { etiqueta: "Guardado", tono: "text-success", icono: Check },
  error: { etiqueta: "No se pudo guardar", tono: "text-danger", icono: AlertCircle },
}

export function IndicadorGuardado({ estado }: IndicadorGuardadoProps) {
  const meta = META[estado]
  const Icono = meta.icono
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-caption", meta.tono)}>
      <Icono
        className={cn("h-3.5 w-3.5", estado === "guardando" ? "animate-spin" : "")}
        strokeWidth={1.5}
        aria-hidden={true}
      />
      <span>{meta.etiqueta}</span>
    </span>
  )
}
