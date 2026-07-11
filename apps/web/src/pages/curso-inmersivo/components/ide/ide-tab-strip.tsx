import { BookOpen, Code2 } from "lucide-react"

interface IdeTabStripProps {
  readonly titulo: string
  /** Bloques evaluables de la sección; > 0 = "reto" (icono Code2), si no lectura. */
  readonly bloquesTotales: number | undefined
}

/**
 * Tira de pestañas del IDE inmerso: la sección abierta como "archivo" activo
 * (patrón VS Code). Barra de chrome (`bg-subtle`) con la pestaña activa sobre
 * el lienzo (`bg-canvas`) y una guía índigo arriba. Hoy una sola pestaña —
 * la navegación es dirigida por el plan; al soportar varias secciones abiertas
 * a la vez, aquí se listan como tabs.
 */
export function IdeTabStrip({ titulo, bloquesTotales }: IdeTabStripProps) {
  const esReto = (bloquesTotales ?? 0) > 0
  const Icono = esReto ? Code2 : BookOpen
  return (
    <div className="flex shrink-0 items-stretch border-border border-b bg-subtle px-2">
      <div className="relative flex items-center gap-2 bg-canvas px-3.5 py-2">
        <span aria-hidden={true} className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
        <Icono aria-hidden={true} strokeWidth={1.75} className="h-4 w-4 shrink-0 text-accent" />
        <span
          title={titulo}
          className="max-w-[280px] truncate font-code text-body-sm text-text-primary"
        >
          {titulo}
        </span>
      </div>
    </div>
  )
}
