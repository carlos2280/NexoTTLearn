import type { ModuloInmersivoProgreso, SeccionInmersiva } from "@nexott-learn/shared-types"
import { useMemo } from "react"
import { SidebarSeccion } from "./inmersivo-sidebar-seccion"

interface InmersivoSidebarProps {
  readonly secciones: readonly SeccionInmersiva[]
  readonly progreso: ModuloInmersivoProgreso
  readonly bloqueActualId: string | null
  readonly onSeleccionarBloque: (bloqueId: string) => void
}

// Sidebar 280 px expandido — README.md §5 + nav-modulo.md. S1 SIN colapsable
// (Cmd+B entra en S5), SIN modo cueva. Auto-expande la seccion que contiene
// el bloque actual; las demas se pueden expandir/colapsar manualmente.

export function InmersivoSidebar({
  secciones,
  progreso,
  bloqueActualId,
  onSeleccionarBloque,
}: InmersivoSidebarProps) {
  const seccionActualId = useMemo(() => {
    if (bloqueActualId === null) {
      return secciones[0]?.id ?? null
    }
    for (const s of secciones) {
      if (s.bloques.some((b) => b.id === bloqueActualId)) {
        return s.id
      }
    }
    return secciones[0]?.id ?? null
  }, [bloqueActualId, secciones])

  return (
    <aside
      aria-label="Indice del modulo"
      className="flex w-sidebar-inmersivo shrink-0 flex-col border-glass-border border-r bg-surface-0/40"
    >
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h2 className="mb-3 px-2 font-semibold text-eyebrow text-text-muted uppercase">
          Secciones
        </h2>
        <ul className="flex flex-col gap-1.5">
          {secciones.map((seccion) => (
            <SidebarSeccion
              key={seccion.id}
              seccion={seccion}
              esActual={seccion.id === seccionActualId}
              bloqueActualId={bloqueActualId}
              onSeleccionarBloque={onSeleccionarBloque}
            />
          ))}
        </ul>
      </div>
      <ProgresoFooter progreso={progreso} />
    </aside>
  )
}

function ProgresoFooter({ progreso }: { readonly progreso: ModuloInmersivoProgreso }) {
  return (
    <div className="border-glass-border border-t px-4 py-4">
      <p className="mb-2 font-semibold text-eyebrow text-text-muted uppercase">
        Progreso del modulo
      </p>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-glass-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
          style={{ width: `${progreso.porcentaje}%` }}
        />
      </div>
      <p className="mt-2 text-text-muted text-xs">
        {progreso.bloquesInteractuados} de {progreso.bloquesTotales} contenidos
      </p>
    </div>
  )
}
