import { useEnviarTurnoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-enviar-turno-entrevista-ia"
import type {
  IntentoEntrevistaIaParticipanteResponse,
  TurnoEntrevistaIa,
} from "@nexott-learn/shared-types"
import { AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"

const RGX_ESPACIOS = /\s+/
import { AtmosferaAurora } from "./atmosfera-aurora"
import { CabeceraChat } from "./cabecera-chat"
import { IndicadorEscribiendo } from "./indicador-escribiendo"
import { InputEntrevista } from "./input-entrevista"
import { MensajeEvaluador } from "./mensaje-evaluador"
import { MensajeUsuario } from "./mensaje-usuario"
import { VistaCierreStub } from "./vista-cierre-stub"

interface ChatEntrevistaIaProps {
  readonly intentoInicial: IntentoEntrevistaIaParticipanteResponse
}

/**
 * Vista 2 del hito Entrevista IA (spec 06) — chat activo. Pantalla mas
 * inmersiva del viaje: foco absoluto, atmosfera aurora sutil de fondo,
 * mensajes editoriales sin bubbles tradicionales, streaming visual del
 * texto del evaluador, indicador "escribiendo" + atajo Cmd/Ctrl+Enter.
 *
 * Cuando la IA cierra (finalizado=true), pasa a `VistaCierreStub` (vistas
 * 3a/3b reales en F3).
 */
export function ChatEntrevistaIa({ intentoInicial }: ChatEntrevistaIaProps) {
  const [turnos, setTurnos] = useState<readonly TurnoEntrevistaIa[]>(intentoInicial.transcripcion)
  const [finalizado, setFinalizado] = useState(intentoInicial.estado === "FINALIZADO")
  const [aprobado, setAprobado] = useState(intentoInicial.aprobado === true)
  const [intentoId] = useState(intentoInicial.intentoId)
  const [ultimoTurnoIaIdx, setUltimoTurnoIaIdx] = useState<number>(
    intentoInicial.transcripcion.length - 1,
  )
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const enviar = useEnviarTurnoEntrevistaIa()

  // Auto-scroll al fondo cuando cambian los turnos o aparece "escribiendo".
  // `turnos.length` y `enviar.isPending` son triggers, no se leen dentro.
  // biome-ignore lint/correctness/useExhaustiveDependencies: triggers, no reads.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [turnos.length, enviar.isPending])

  const onEnviarMensaje = (mensaje: string): void => {
    const ahora = new Date().toISOString()
    const turnoUser: TurnoEntrevistaIa = { rol: "COLABORADOR", mensaje, timestamp: ahora }
    setTurnos((prev) => [...prev, turnoUser])
    enviar.mutate(
      { intentoId, body: { mensaje } },
      {
        onSuccess: (resp) => {
          const turnoIa: TurnoEntrevistaIa = {
            rol: "ASISTENTE",
            mensaje: resp.respuestaIa,
            timestamp: new Date().toISOString(),
          }
          setTurnos((prev) => {
            const next = [...prev, turnoIa]
            setUltimoTurnoIaIdx(next.length - 1)
            return next
          })
          if (resp.finalizado) {
            // Espera a que termine el streaming visual antes de cerrar.
            const palabras = resp.respuestaIa.split(RGX_ESPACIOS).length
            const tiempoEstimadoMs = palabras * 45 + 600
            window.setTimeout(() => {
              setFinalizado(true)
              // En F3 esto vendra del backend (finalizar-entrevista). De momento
              // asumimos aprobado=true salvo override `nexott-mock:entrevista-ia-resultado`.
              const overrideRaw =
                typeof window !== "undefined"
                  ? window.localStorage.getItem("nexott-mock:entrevista-ia-resultado")
                  : null
              setAprobado(overrideRaw !== "NO_APROBADO")
            }, tiempoEstimadoMs)
          }
        },
      },
    )
  }

  if (finalizado && ultimoTurnoIaIdx === turnos.length - 1 && !enviar.isPending) {
    // Damos espacio para que el ultimo mensaje IA se lea antes de cerrar.
    // Cuando setTimeout dispara, finalizado=true y mostramos cierre.
    return (
      <main className="relative flex flex-1 overflow-hidden bg-canvas">
        <AtmosferaAurora />
        <VistaCierreStub aprobado={aprobado} />
      </main>
    )
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-canvas">
      <AtmosferaAurora />
      <CabeceraChat inicioISO={intentoInicial.fecha} activa={!finalizado} />
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-7">
          {turnos.map((turno, idx) =>
            turno.rol === "ASISTENTE" ? (
              <MensajeEvaluador
                key={`${turno.timestamp}-${idx}`}
                mensaje={turno.mensaje}
                streaming={idx === ultimoTurnoIaIdx && idx > 0}
              />
            ) : (
              <MensajeUsuario key={`${turno.timestamp}-${idx}`} mensaje={turno.mensaje} />
            ),
          )}
          <AnimatePresence>{enviar.isPending ? <IndicadorEscribiendo /> : null}</AnimatePresence>
        </div>
      </div>
      <InputEntrevista onEnviar={onEnviarMensaje} deshabilitado={enviar.isPending || finalizado} />
    </main>
  )
}
