import { SidePeek } from "@/shared/components/ui/side-peek"
import type { TurnoEntrevistaIa } from "@nexott-learn/shared-types"
import { MensajeEvaluador } from "../chat/mensaje-evaluador"
import { MensajeUsuario } from "../chat/mensaje-usuario"

interface DrawerReleerEntrevistaProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly turnos: readonly TurnoEntrevistaIa[]
  readonly fechaISO: string
}

/**
 * Vista 4 (spec 06) — drawer "Releer la entrevista". Panel lateral con la
 * transcripcion completa del intento, en la misma estetica editorial del
 * chat pero sin streaming ni atmosfera aurora: es histórico, no momento
 * inmersivo.
 */
export function DrawerReleerEntrevista({
  abierto,
  onCambiarAbierto,
  turnos,
  fechaISO,
}: DrawerReleerEntrevistaProps) {
  const fechaFormateada = formatearFecha(fechaISO)
  return (
    <SidePeek
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Releer la entrevista"
      descripcion={fechaFormateada}
      ancho="xl"
    >
      <div className="flex flex-col gap-7 py-2">
        {turnos.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">
            No hay transcripción disponible para este intento.
          </p>
        ) : (
          turnos.map((turno, idx) =>
            turno.rol === "ASISTENTE" ? (
              <MensajeEvaluador
                key={`${turno.timestamp}-${idx}`}
                mensaje={turno.mensaje}
                streaming={false}
              />
            ) : (
              <MensajeUsuario key={`${turno.timestamp}-${idx}`} mensaje={turno.mensaje} />
            ),
          )
        )}
      </div>
    </SidePeek>
  )
}

function formatearFecha(iso: string): string {
  try {
    const fecha = new Date(iso)
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(fecha)
  } catch {
    return ""
  }
}
