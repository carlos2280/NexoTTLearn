import { useCrearIntentoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-crear-intento-entrevista-ia"
import { useDisponibilidadEntrevistaIa } from "@/features/entrevista-ia/hooks/use-disponibilidad-entrevista-ia"
import { useEntrevistaIaCurso } from "@/features/entrevista-ia/hooks/use-entrevista-ia-curso"
import type { IntentoEntrevistaIaParticipanteResponse } from "@nexott-learn/shared-types"
import { AlertCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
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

  const chatActivo = intentoActivo !== null
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

  if (intentoActivo) {
    return (
      <ChatEntrevistaIa intentoInicial={intentoActivo} onSalir={() => setIntentoActivo(null)} />
    )
  }

  if (!disponibilidad.data.disponible) {
    return (
      <main className="flex flex-1 flex-col overflow-y-auto bg-canvas px-8 py-10">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <VistaBloqueadaEntrevistaIa disponibilidad={disponibilidad.data} />
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

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-canvas px-8 py-10">
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
    </main>
  )
}

function ErrorCanvas() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
      <article className="flex max-w-md flex-col items-start gap-3">
        <span className="nx-eyebrow inline-flex items-center gap-2 text-text-tertiary">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden={true} />
          Hito de cierre
        </span>
        <h2 className="text-h2 text-text-primary">No pudimos cargar la entrevista IA.</h2>
        <p className="text-body-sm text-text-secondary">
          Reintenta en un momento. Si persiste, avisa al administrador del curso.
        </p>
      </article>
    </main>
  )
}

function SinAsignacion() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
      <article className="flex max-w-md flex-col items-start gap-3">
        <span className="nx-eyebrow text-text-tertiary">Hito de cierre</span>
        <h2 className="text-h2 text-text-primary">Entrevista IA</h2>
        <p className="text-body-sm text-text-secondary">
          Necesitas estar inscrito en el curso para hacer la entrevista.
        </p>
      </article>
    </main>
  )
}
