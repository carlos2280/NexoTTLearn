import { MensajeEvaluador } from "@/features/entrevista-ia/components/mensaje-evaluador"
import { MensajeUsuario } from "@/features/entrevista-ia/components/mensaje-usuario"
import { useObtenerIntentoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-obtener-intento-entrevista-ia"
import { SidePeek } from "@/shared/components/ui/side-peek"
import type { IntentoEntrevistaIaParticipanteResponse } from "@nexott-learn/shared-types"
import { Loader2 } from "lucide-react"

interface DrawerReleerEntrevistaProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly intentoId: string
}

/**
 * Vista 4 (spec 06) — drawer "Releer la entrevista". Panel lateral con la
 * transcripcion completa del intento, en la misma estetica editorial del
 * chat pero sin streaming ni atmosfera aurora: es historico, no momento
 * inmersivo.
 *
 * Recibe solo `intentoId` y pide el detalle al backend (`GET
 * /intentos-entrevista-ia/:id`) en cuanto se abre. Tanstack Query cachea,
 * asi que el segundo open de la misma entrevista es instantaneo. Esto unifica
 * el drawer entre el cierre del chat (donde el cache ya esta caliente) y
 * /mi-ficha (donde no tenemos turnos en memoria).
 */
export function DrawerReleerEntrevista({
  abierto,
  onCambiarAbierto,
  intentoId,
}: DrawerReleerEntrevistaProps) {
  const intento = useObtenerIntentoEntrevistaIa(intentoId, { enabled: abierto })
  const titulo = "Releer la entrevista"
  const descripcion = intento.data ? formatearFecha(intento.data.fecha) : undefined

  return (
    <SidePeek
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={titulo}
      descripcion={descripcion}
      ancho="xl"
    >
      {intento.isLoading || !intento.data ? (
        <Estado mensaje="Cargando entrevista" />
      ) : (
        <Transcripcion intento={intento.data} />
      )}
    </SidePeek>
  )
}

function Transcripcion({ intento }: { readonly intento: IntentoEntrevistaIaParticipanteResponse }) {
  if (intento.transcripcion.length === 0) {
    return (
      <p className="text-body-sm text-text-tertiary">
        No hay transcripción disponible para este intento.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-7 py-2">
      {intento.transcripcion.map((turno, idx) =>
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
    </div>
  )
}

function Estado({ mensaje }: { readonly mensaje: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" aria-label={mensaje} />
    </div>
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
