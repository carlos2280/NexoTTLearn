import { MensajeEvaluador } from "@/features/entrevista-ia/components/mensaje-evaluador"
import { MensajeUsuario } from "@/features/entrevista-ia/components/mensaje-usuario"
import type { TurnoEntrevistaIa } from "@nexott-learn/shared-types"

interface SeccionTranscripcionProps {
  readonly turnos: readonly TurnoEntrevistaIa[]
}

/**
 * Lista completa del intercambio EVALUADOR ↔ COLABORADOR. Reutiliza los
 * componentes de mensaje del chat real para mantener una sola representacion
 * visual del intercambio en toda la app.
 */
export function SeccionTranscripcion({ turnos }: SeccionTranscripcionProps) {
  if (turnos.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">Transcripcion</span>
        <p className="text-body-sm text-text-tertiary">Este intento no tiene turnos registrados.</p>
      </section>
    )
  }
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Transcripcion</span>
        <h2 className="text-h3 text-text-primary">{turnos.length} turnos</h2>
      </header>
      <ol className="flex flex-col gap-7">
        {turnos.map((turno, idx) =>
          turno.rol === "ASISTENTE" ? (
            <MensajeEvaluador
              key={`${turno.timestamp}-${idx}`}
              mensaje={turno.mensaje}
              streaming={false}
            />
          ) : (
            <MensajeUsuario key={`${turno.timestamp}-${idx}`} mensaje={turno.mensaje} />
          ),
        )}
      </ol>
    </section>
  )
}
