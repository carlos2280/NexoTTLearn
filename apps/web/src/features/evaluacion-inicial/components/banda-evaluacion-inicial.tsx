import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { ClipboardList, History, Sparkles } from "lucide-react"
import { useState } from "react"
import { useHistorialEvaluacion } from "../hooks/use-historial-evaluacion"
import { FlujoEvaluacionDialog } from "./flujo-evaluacion-dialog"
import { HistorialEvaluacionDialog } from "./historial-evaluacion-dialog"

interface BandaEvaluacionInicialProps {
  readonly cursoId: string
  readonly nombreCurso: string
}

function fechaRelativa(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
}

export function BandaEvaluacionInicial({ cursoId, nombreCurso }: BandaEvaluacionInicialProps) {
  const [flujoAbierto, setFlujoAbierto] = useState(false)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const { data, isLoading } = useHistorialEvaluacion(cursoId, 1, 1)

  if (isLoading || !data) {
    return null
  }

  const ultima = data.data[0]
  const tieneCargas = data.meta.total > 0 && ultima !== undefined

  return (
    <>
      {tieneCargas ? (
        <Card tono="plano" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles
              className="h-4 w-4 text-success-on-soft"
              strokeWidth={1.5}
              aria-hidden={true}
            />
            <div className="flex flex-col">
              <span className="text-body-sm text-text-primary">
                Evaluación inicial cargada · {ultima.colaboradoresActualizados} persona(s) ·{" "}
                {ultima.skillsActualizadas} skill(s)
              </span>
              <span className="text-caption text-text-tertiary">
                Última carga: {fechaRelativa(ultima.aplicadoEn)} por {ultima.aplicadoPor.nombre}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setHistorialAbierto(true)}
            >
              <History className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Historial ({data.meta.total})
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFlujoAbierto(true)}
            >
              Recargar
            </Button>
          </div>
        </Card>
      ) : (
        <Card tono="plano" className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              aria-hidden={true}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-soft text-info-on-soft"
            >
              <ClipboardList className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-body text-text-primary">Evaluación inicial pendiente</h3>
              <p className="max-w-xl text-body-sm text-text-secondary">
                Sin la evaluación inicial, los planes personales no consideran las notas previas de
                cada persona.
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setFlujoAbierto(true)}>
            Empezar evaluación inicial
          </Button>
        </Card>
      )}

      <FlujoEvaluacionDialog
        abierto={flujoAbierto}
        cursoId={cursoId}
        nombreCurso={nombreCurso}
        onCerrar={() => setFlujoAbierto(false)}
      />
      <HistorialEvaluacionDialog
        abierto={historialAbierto}
        onCambiarAbierto={setHistorialAbierto}
        cursoId={cursoId}
      />
    </>
  )
}
