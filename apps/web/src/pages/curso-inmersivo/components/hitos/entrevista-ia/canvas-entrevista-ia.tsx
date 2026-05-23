import { useContinuarIntentoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-continuar-intento-entrevista-ia"
import { useCrearIntentoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-crear-intento-entrevista-ia"
import { useDisponibilidadEntrevistaIa } from "@/features/entrevista-ia/hooks/use-disponibilidad-entrevista-ia"
import { useEntrevistaIaCurso } from "@/features/entrevista-ia/hooks/use-entrevista-ia-curso"
import { DUR, EASE } from "@/shared/lib/motion"
import type { IntentoEntrevistaIaParticipanteResponse } from "@nexott-learn/shared-types"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ErrorCanvas, SinAsignacion } from "./canvas-entrevista-ia-estados"
import { ChatEntrevistaIa } from "./chat/chat-entrevista-ia"
import { VistaBloqueadaEntrevistaIa } from "./vista-bloqueada-entrevista-ia"
import { VistaBriefEntrevistaIa } from "./vista-brief-entrevista-ia"

interface CanvasEntrevistaIaProps {
  readonly cursoId: string
  readonly asignacionId: string | null
  /**
   * Notifica al page cuando el chat esta activo (foco absoluto) para que
   * atenue sidebar y topbar (decision V3 de F2 — modo focus).
   */
  readonly onChatActivoChange?: (activo: boolean) => void
}

/**
 * Orquestador del canvas de la Entrevista IA. F2: brief → click "Iniciar
 * entrevista" → crea intento → conmuta a chat activo. Cuando la IA cierra
 * la conversacion, el chat muestra `VistaCierreStub` (vistas 3a/3b reales
 * en F3). Vista 5 (bloqueada) se mantiene como puerta de entrada.
 */
export function CanvasEntrevistaIa({
  cursoId,
  asignacionId,
  onChatActivoChange,
}: CanvasEntrevistaIaProps) {
  const entrevista = useEntrevistaIaCurso(cursoId)
  const disponibilidad = useDisponibilidadEntrevistaIa(asignacionId)
  const crear = useCrearIntentoEntrevistaIa()
  const [intentoActivo, setIntentoActivo] =
    useState<IntentoEntrevistaIaParticipanteResponse | null>(null)
  const continuarIntento = useContinuarIntentoEntrevistaIa(setIntentoActivo)

  const chatActivo = intentoActivo !== null
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    onChatActivoChange?.(chatActivo)
    return () => onChatActivoChange?.(false)
  }, [chatActivo, onChatActivoChange])

  if (entrevista.isLoading || disponibilidad.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <Loader2
          className="h-5 w-5 animate-spin text-text-tertiary"
          aria-label="Cargando entrevista IA"
        />
      </main>
    )
  }

  if (entrevista.error || !entrevista.data || disponibilidad.error || !disponibilidad.data) {
    return <ErrorCanvas />
  }

  if (!asignacionId) {
    return <SinAsignacion />
  }

  if (!disponibilidad.data.disponible && !intentoActivo) {
    const enCursoId = disponibilidad.data.intentoEnCursoId
    const continuar = enCursoId ? () => continuarIntento(enCursoId) : undefined
    return (
      <main className="flex flex-1 flex-col overflow-y-auto bg-canvas px-8 py-10">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <VistaBloqueadaEntrevistaIa
            disponibilidad={disponibilidad.data}
            onContinuarIntento={continuar}
          />
        </div>
      </main>
    )
  }

  const onEmpezar = async (): Promise<void> => {
    const resp = await crear.mutateAsync({ asignacionId })
    const ahora = new Date().toISOString()
    setIntentoActivo({
      intentoId: resp.intentoId,
      estado: "EN_PROGRESO",
      fecha: ahora,
      transcripcion: [
        {
          rol: "ASISTENTE",
          mensaje: resp.primeraPregunta,
          timestamp: ahora,
        },
      ],
      notaGlobal: null,
      aprobado: null,
      anulado: false,
      notasPorArea: [],
    })
  }

  // Transicion brief <-> chat con `mode="wait"` para que el brief termine
  // de salir antes de que el chat entre. Coherente con la sensacion del modo
  // focus que ocurre en paralelo (duracion cinematic).
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: DUR.storytelling, ease: EASE.default }
  const initial = reducedMotion ? false : { opacity: 0, y: 8 }
  const exit = reducedMotion ? undefined : { opacity: 0, y: -4 }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {intentoActivo ? (
        <motion.div
          key="chat"
          className="flex flex-1"
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          exit={exit}
          transition={transition}
        >
          <ChatEntrevistaIa intentoInicial={intentoActivo} onSalir={() => setIntentoActivo(null)} />
        </motion.div>
      ) : (
        <motion.main
          key="brief"
          className="flex flex-1 flex-col overflow-y-auto bg-canvas px-8 py-10"
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          exit={exit}
          transition={transition}
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col">
            <VistaBriefEntrevistaIa
              entrevista={entrevista.data}
              onEmpezar={() => {
                onEmpezar().catch(() => {
                  // Errores los maneja el state de la mutation; basta con no romper la promise.
                })
              }}
            />
          </div>
        </motion.main>
      )}
    </AnimatePresence>
  )
}
