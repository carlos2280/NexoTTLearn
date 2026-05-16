import type { FilaAvanceCurso } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { obtenerEstado } from "../avance-curso.types"
import { AvanceAlertasChips } from "./avance-alertas-chips"
import { AvanceBarra } from "./avance-barra"

interface AvanceTablaProps {
  readonly filas: readonly FilaAvanceCurso[]
}

export function AvanceTabla({ filas }: AvanceTablaProps) {
  if (filas.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-canvas px-6 py-12 text-center">
        <p className="text-body-sm text-text-secondary">No hay asignaciones para este curso.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card-resting)]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-border border-b bg-subtle">
            <Th>Colaborador</Th>
            <Th>Estado</Th>
            <Th className="w-[28%]">Avance</Th>
            <Th>Alertas</Th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <FilaAvance key={fila.asignacionId} fila={fila} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ThProps {
  readonly children: ReactNode
  readonly className?: string
}

function Th({ children, className }: ThProps) {
  return (
    <th
      className={`nx-eyebrow px-5 py-3 text-left text-text-tertiary ${className ?? ""}`}
      scope="col"
    >
      {children}
    </th>
  )
}

interface FilaAvanceProps {
  readonly fila: FilaAvanceCurso
}

function FilaAvance({ fila }: FilaAvanceProps) {
  const estadoDef = obtenerEstado(fila.estado)

  return (
    <tr className="border-border border-b transition-colors duration-base ease-default last:border-b-0 hover:bg-subtle/60">
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-body-sm text-text-primary">
            {fila.colaborador.nombre}
          </span>
          <span className="text-caption text-text-tertiary">{fila.colaborador.email}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        {estadoDef ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-medium text-caption"
            style={{ background: estadoDef.tokenSoft, color: estadoDef.tokenOnSoft }}
          >
            <span
              className="h-1.5 w-1.5 rounded-pill"
              style={{ background: estadoDef.tokenColor }}
              aria-hidden={true}
            />
            {estadoDef.etiqueta}
          </span>
        ) : (
          <span className="text-caption text-text-tertiary">{fila.estado}</span>
        )}
      </td>
      <td className="px-5 py-4">
        <AvanceBarra porcentaje={fila.porcentajeAvance} />
      </td>
      <td className="px-5 py-4">
        <AvanceAlertasChips alertas={fila.alertas} />
      </td>
    </tr>
  )
}
