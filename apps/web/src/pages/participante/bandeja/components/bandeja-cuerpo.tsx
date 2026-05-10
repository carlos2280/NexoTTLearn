import type { BandejaEstado, BandejaSiguientePaso, BandejaStream } from "@nexott-learn/shared-types"
import { useState } from "react"
import { BandejaStreamBlock } from "./bandeja-stream"
import { EstadoAlDiaBlock } from "./estado-al-dia-block"
import { EstadoAsignadoBlock } from "./estado-asignado-block"
import { EstadoCursoCompletadoBlock } from "./estado-curso-completado-block"
import { EstadoVacioBlock } from "./estado-vacio-block"
import { SiguientePasoCard } from "./siguiente-paso-card"

interface BandejaCuerpoProps {
  readonly estado: BandejaEstado
  readonly siguientePaso: BandejaSiguientePaso | null
  readonly stream: BandejaStream
}

// Orquesta el cuerpo principal de la bandeja segun §6 del doc canonico.
// Cada estado decide que combinacion renderiza: hero accionable, empty-state,
// celebracion, y/o stream de actividades.
export function BandejaCuerpo({ estado, siguientePaso, stream }: BandejaCuerpoProps) {
  const [celebracionDescartada, setCelebracionDescartada] = useState(false)

  switch (estado) {
    case "VACIO":
      return <EstadoVacioBlock />

    case "ASIGNADO_NO_INICIADO":
      return (
        <>
          <EstadoAsignadoBlock siguientePaso={siguientePaso} />
          <BandejaStreamBlock stream={stream} />
        </>
      )

    case "CURSO_COMPLETADO": {
      if (!celebracionDescartada) {
        return (
          <EstadoCursoCompletadoBlock
            siguientePaso={siguientePaso}
            onVolver={() => setCelebracionDescartada(true)}
          />
        )
      }
      return (
        <>
          {siguientePaso ? <SiguientePasoCard paso={siguientePaso} /> : null}
          <BandejaStreamBlock stream={stream} />
        </>
      )
    }

    case "AL_DIA":
      return (
        <>
          {siguientePaso ? <SiguientePasoCard paso={siguientePaso} /> : null}
          <EstadoAlDiaBlock />
        </>
      )

    case "EN_CURSO":
    case "HITO_DESBLOQUEADO":
      return (
        <>
          {siguientePaso ? <SiguientePasoCard paso={siguientePaso} /> : null}
          <BandejaStreamBlock stream={stream} />
        </>
      )

    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
