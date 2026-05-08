import type { ModuloInmersivoResponse } from "@nexott-learn/shared-types"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBloqueEnViewport } from "../hooks/use-bloque-en-viewport"
import { useInmersivoKeyboard } from "../hooks/use-inmersivo-keyboard"
import { InmersivoCanvas } from "./inmersivo-canvas"
import { InmersivoDock } from "./inmersivo-dock"
import { InmersivoMiniHeader } from "./inmersivo-mini-header"
import { InmersivoSidebar } from "./inmersivo-sidebar"

interface InmersivoShellProps {
  readonly data: ModuloInmersivoResponse
}

// Shell del modo inmersivo: orquesta mini-header + sidebar + canvas + dock,
// gestiona estado del bloque actual (combinacion de scroll observer + click
// del sidebar / atajos), y enruta salida hacia /cursos/:slug.

export function InmersivoShell({ data }: InmersivoShellProps) {
  const { curso, modulo, secciones, progreso, navegacion } = data
  const navigate = useNavigate()

  const bloqueIds = useMemo(() => secciones.flatMap((s) => s.bloques.map((b) => b.id)), [secciones])
  const observadoId = useBloqueEnViewport({ bloqueIds })
  const [bloqueForzadoId, setBloqueForzadoId] = useState<string | null>(null)
  const bloqueActualId = bloqueForzadoId ?? observadoId ?? navegacion.bloqueInicialId

  const indiceActual = bloqueIds.indexOf(bloqueActualId)
  const siguienteId = indiceActual >= 0 ? bloqueIds[indiceActual + 1] : undefined
  const anteriorId = indiceActual >= 0 ? bloqueIds[indiceActual - 1] : undefined

  const irABloque = useCallback((bloqueId: string) => {
    setBloqueForzadoId(bloqueId)
    const el = document.getElementById(`block-${bloqueId}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    // Soltamos el "forzado" para que el observer retome el control en el scroll.
    window.setTimeout(() => setBloqueForzadoId(null), 600)
  }, [])

  const onSiguiente = useCallback(() => {
    if (siguienteId) {
      irABloque(siguienteId)
    }
  }, [siguienteId, irABloque])

  const onAnterior = useCallback(() => {
    if (anteriorId) {
      irABloque(anteriorId)
    }
  }, [anteriorId, irABloque])

  const onSalir = useCallback(() => {
    navigate(curso.hrefVolver)
  }, [navigate, curso.hrefVolver])

  useInmersivoKeyboard({ onSalir, onSiguiente, onAnterior })

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={500}>
      <div className="flex h-screen flex-col bg-surface-0">
        <InmersivoMiniHeader curso={curso} moduloTitulo={modulo.titulo} progreso={progreso} />
        <div className="flex flex-1 overflow-hidden">
          <InmersivoSidebar
            secciones={secciones}
            progreso={progreso}
            bloqueActualId={bloqueActualId}
            onSeleccionarBloque={irABloque}
          />
          <InmersivoCanvas modulo={modulo} secciones={secciones} bloqueActualId={bloqueActualId} />
        </div>
        <InmersivoDock
          progreso={progreso}
          tieneAnterior={anteriorId !== undefined}
          tieneSiguiente={siguienteId !== undefined}
          onAnterior={onAnterior}
          onSiguiente={onSiguiente}
          onCompletarModulo={onSalir}
        />
      </div>
    </TooltipProvider>
  )
}
