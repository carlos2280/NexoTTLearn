import { Card } from "@/shared/components/ui/card"
import type {
  HayMasIntentos,
  IntentoBloqueResumen,
  IntentoEntrevistaIaResumen,
  IntentoTransversalResumen,
  UltimosIntentos,
} from "@nexott-learn/shared-types"
import { Blocks, BotMessageSquare, FileStack, MoreHorizontal } from "lucide-react"
import { tokenPorNota } from "../detalle-colaborador.types"

interface DetalleUltimosIntentosProps {
  readonly ultimos: UltimosIntentos
  readonly hayMas: HayMasIntentos
}

function formatearFecha(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DetalleUltimosIntentos({ ultimos, hayMas }: DetalleUltimosIntentosProps) {
  return (
    <Card tono="plano" densidad="generosa" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Actividad</span>
        <h2 className="text-h3 text-text-primary">Últimos intentos</h2>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SeccionBloques intentos={ultimos.bloque} hayMas={hayMas.bloque} />
        <SeccionTransversal intentos={ultimos.transversal} hayMas={hayMas.transversal} />
        <SeccionEntrevistaIa intentos={ultimos.entrevistaIa} hayMas={hayMas.entrevistaIa} />
      </div>
    </Card>
  )
}

interface SeccionVaciaProps {
  readonly mensaje: string
}

function Vacio({ mensaje }: SeccionVaciaProps) {
  return <p className="text-caption text-text-tertiary">{mensaje}</p>
}

interface MasIndicadorProps {
  readonly hayMas: boolean
}

function MasIndicador({ hayMas }: MasIndicadorProps) {
  if (!hayMas) {
    return null
  }
  return (
    <li className="inline-flex items-center gap-1.5 text-caption text-text-tertiary">
      <MoreHorizontal className="h-3.5 w-3.5" aria-hidden={true} />
      Hay más intentos disponibles
    </li>
  )
}

interface SeccionBloquesProps {
  readonly intentos: readonly IntentoBloqueResumen[]
  readonly hayMas: boolean
}

function SeccionBloques({ intentos, hayMas }: SeccionBloquesProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="inline-flex items-center gap-2 font-medium text-body-sm text-text-primary">
        <Blocks className="h-4 w-4 text-text-tertiary" aria-hidden={true} />
        Bloques didácticos
      </h3>
      {intentos.length === 0 ? (
        <Vacio mensaje="Sin intentos de bloque registrados." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {intentos.map((it) => {
            const color = tokenPorNota(it.mejorPorcentaje)
            return (
              <li
                key={it.id}
                className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="tabular font-mono text-caption text-text-tertiary">
                  {formatearFecha(it.fechaInicio)}
                </span>
                <span className="inline-flex items-baseline gap-1.5">
                  {it.estaInvalidado && (
                    <span className="rounded-pill bg-[rgb(var(--color-danger-rgb)/0.12)] px-1.5 text-[10px] text-danger-on-soft">
                      Invalidado
                    </span>
                  )}
                  {it.mejorPorcentaje === null ? (
                    <span className="text-caption text-text-tertiary">—</span>
                  ) : (
                    <span className="tabular font-medium font-mono text-body-sm" style={{ color }}>
                      {Math.round(it.mejorPorcentaje)}%
                    </span>
                  )}
                </span>
              </li>
            )
          })}
          <MasIndicador hayMas={hayMas} />
        </ul>
      )}
    </div>
  )
}

interface SeccionTransversalProps {
  readonly intentos: readonly IntentoTransversalResumen[]
  readonly hayMas: boolean
}

function SeccionTransversal({ intentos, hayMas }: SeccionTransversalProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="inline-flex items-center gap-2 font-medium text-body-sm text-text-primary">
        <FileStack className="h-4 w-4 text-text-tertiary" aria-hidden={true} />
        Transversal
      </h3>
      {intentos.length === 0 ? (
        <Vacio mensaje="Sin intentos transversales." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {intentos.map((it) => (
            <li
              key={it.id}
              className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span className="tabular font-mono text-caption text-text-tertiary">
                {formatearFecha(it.fechaInicio)}
              </span>
              <span className="inline-flex items-baseline gap-1.5">
                <span className="text-caption text-text-secondary">{it.estado}</span>
                <span className="tabular font-mono text-caption text-text-tertiary">
                  {it.capasCargadas}/3
                </span>
              </span>
            </li>
          ))}
          <MasIndicador hayMas={hayMas} />
        </ul>
      )}
    </div>
  )
}

interface SeccionEntrevistaIaProps {
  readonly intentos: readonly IntentoEntrevistaIaResumen[]
  readonly hayMas: boolean
}

function SeccionEntrevistaIa({ intentos, hayMas }: SeccionEntrevistaIaProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="inline-flex items-center gap-2 font-medium text-body-sm text-text-primary">
        <BotMessageSquare className="h-4 w-4 text-text-tertiary" aria-hidden={true} />
        Entrevista IA
      </h3>
      {intentos.length === 0 ? (
        <Vacio mensaje="Sin entrevistas IA registradas." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {intentos.map((it) => {
            const nota = it.notaAjustadaAdmin ?? it.notaGlobal
            const color = tokenPorNota(nota)
            return (
              <li
                key={it.id}
                className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="tabular font-mono text-caption text-text-tertiary">
                  {formatearFecha(it.fechaInicio)}
                </span>
                <span className="inline-flex items-baseline gap-1.5">
                  {it.notaAjustadaAdmin !== null && (
                    <span className="text-[10px] text-text-tertiary">ajust.</span>
                  )}
                  {nota === null ? (
                    <span className="text-caption text-text-tertiary">—</span>
                  ) : (
                    <span className="tabular font-medium font-mono text-body-sm" style={{ color }}>
                      {Math.round(nota)}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
          <MasIndicador hayMas={hayMas} />
        </ul>
      )}
    </div>
  )
}
