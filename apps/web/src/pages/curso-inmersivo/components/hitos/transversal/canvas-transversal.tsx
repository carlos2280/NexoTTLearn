import { useListarIntentosTransversal } from "@/features/transversal/hooks/use-listar-intentos-transversal"
import { useTransversalCurso } from "@/features/transversal/hooks/use-transversal-curso"
import type {
  IntentoTransversalParticipanteResponse,
  TransversalResponse,
} from "@nexott-learn/shared-types"
import { AlertCircle, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import { VistaAprobadoTransversal } from "./vista-aprobado-transversal"
import { VistaAunNoTransversal } from "./vista-aun-no-transversal"
import { VistaBriefTransversal } from "./vista-brief-transversal"
import { VistaEvaluandoTransversal } from "./vista-evaluando-transversal"

interface CanvasTransversalProps {
  readonly cursoId: string
  readonly asignacionId: string | null
  readonly tieneEntrevistaIa: boolean
}

/**
 * Orquestador del canvas del proyecto transversal (spec 05). Decide que vista
 * renderizar segun el estado del ultimo intento:
 *
 *  - `forzarBrief` activo (click "Enviar otro intento") → Vista 1.
 *  - Intento EN_EVALUACION → Vista 2 (con polling cada 10s).
 *  - Intento FINALIZADO + aprobado → Vista 3a (recompensa cumbre).
 *  - Intento FINALIZADO + !aprobado → Vista 3b (sin rojo, motivadora).
 *  - Sin intentos → Vista 1 (brief).
 *
 * El polling se enciende solo si hay intento en evaluacion, asi evitamos
 * requests innecesarios cuando el participante consulta un historico.
 */
export function CanvasTransversal({
  cursoId,
  asignacionId,
  tieneEntrevistaIa,
}: CanvasTransversalProps) {
  const [forzarBrief, setForzarBrief] = useState(false)
  const [intentoIdRecienCreado, setIntentoIdRecienCreado] = useState<string | null>(null)

  const transversal = useTransversalCurso(cursoId)

  const intentos = useListarIntentosTransversal(asignacionId)
  const haySondeable = (intentos.data ?? []).some((i) => i.estado === "EN_EVALUACION")
  // Segunda lectura con polling activo si hay intento en evaluacion. Tanstack
  // dedupe por queryKey, asi que esto NO dispara dos requests.
  useListarIntentosTransversal(asignacionId, { pollingActivo: haySondeable })

  const intentoActivo = useMemo(
    () => decidirIntentoActivo(intentos.data ?? [], intentoIdRecienCreado),
    [intentos.data, intentoIdRecienCreado],
  )

  if (transversal.isLoading || intentos.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <Loader2
          className="h-5 w-5 animate-spin text-text-tertiary"
          aria-label="Cargando proyecto transversal"
        />
      </main>
    )
  }

  if (transversal.error || !transversal.data) {
    return <ErrorCanvas />
  }

  if (!asignacionId) {
    return <SinAsignacion />
  }

  const onIntentoCreado = (intentoId: string): void => {
    setForzarBrief(false)
    setIntentoIdRecienCreado(intentoId)
  }

  const listaIntentos = intentos.data ?? []

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-canvas px-8 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <ContenidoTransversal
          transversal={transversal.data}
          asignacionId={asignacionId}
          intentoActivo={intentoActivo}
          intentos={listaIntentos}
          forzarBrief={forzarBrief}
          tieneEntrevistaIa={tieneEntrevistaIa}
          onIntentoCreado={onIntentoCreado}
          onIntentarDeNuevo={() => setForzarBrief(true)}
        />
      </div>
    </main>
  )
}

interface ContenidoTransversalProps {
  readonly transversal: TransversalResponse
  readonly asignacionId: string
  readonly intentoActivo: IntentoTransversalParticipanteResponse | null
  readonly intentos: readonly IntentoTransversalParticipanteResponse[]
  readonly forzarBrief: boolean
  readonly tieneEntrevistaIa: boolean
  readonly onIntentoCreado: (intentoId: string) => void
  readonly onIntentarDeNuevo: () => void
}

function ContenidoTransversal(props: ContenidoTransversalProps) {
  const {
    transversal,
    asignacionId,
    intentoActivo,
    intentos,
    forzarBrief,
    tieneEntrevistaIa,
    onIntentoCreado,
    onIntentarDeNuevo,
  } = props

  if (forzarBrief || intentoActivo === null) {
    // Al reintentar desde vista 3b, prellenamos el form con la URL del ultimo
    // intento (spec 05 — "el participante manda otro; el mejor cuenta").
    const urlInicial = forzarBrief ? intentos[0]?.repoOArtefacto.url : undefined
    return (
      <VistaBriefTransversal
        transversal={transversal}
        asignacionId={asignacionId}
        onIntentoCreado={onIntentoCreado}
        urlInicial={urlInicial}
      />
    )
  }
  if (intentoActivo.estado === "EN_EVALUACION") {
    return <VistaEvaluandoTransversal intento={intentoActivo} />
  }
  if (intentoActivo.aprobado) {
    return (
      <VistaAprobadoTransversal
        intento={intentoActivo}
        intentos={intentos}
        tieneEntrevistaIa={tieneEntrevistaIa}
        skillsDemostradas={transversal.skillsQueMide}
      />
    )
  }
  return (
    <VistaAunNoTransversal
      intento={intentoActivo}
      intentos={intentos}
      onIntentarDeNuevo={onIntentarDeNuevo}
    />
  )
}

function decidirIntentoActivo(
  lista: readonly IntentoTransversalParticipanteResponse[],
  intentoIdRecienCreado: string | null,
): IntentoTransversalParticipanteResponse | null {
  if (intentoIdRecienCreado) {
    const reciente = lista.find((i) => i.intentoId === intentoIdRecienCreado)
    if (reciente) {
      return reciente
    }
  }
  const enEvaluacion = lista.find((i) => i.estado === "EN_EVALUACION")
  if (enEvaluacion) {
    return enEvaluacion
  }
  return lista[0] ?? null
}

function ErrorCanvas() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
      <article className="flex max-w-md flex-col items-start gap-3">
        <span className="nx-eyebrow inline-flex items-center gap-2 text-text-tertiary">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden={true} />
          Hito de cierre
        </span>
        <h2 className="text-h2 text-text-primary">No pudimos cargar el proyecto transversal.</h2>
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
        <h2 className="text-h2 text-text-primary">Proyecto transversal</h2>
        <p className="text-body-sm text-text-secondary">
          Necesitas estar inscrito en el curso para enviar tu proyecto.
        </p>
      </article>
    </main>
  )
}
