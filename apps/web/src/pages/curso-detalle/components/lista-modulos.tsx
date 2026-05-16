import type {
  ModuloPlanParticipante,
  SeccionPlanItemParticipante,
} from "@nexott-learn/shared-types"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { FilaSeccion } from "./fila-seccion"

interface ListaModulosProps {
  readonly modulos: readonly ModuloPlanParticipante[]
  readonly onAbrirSeccion: (seccionId: string) => void
}

export function ListaModulos({ modulos, onAbrirSeccion }: ListaModulosProps) {
  return (
    <ul className="flex flex-col gap-3">
      {modulos.map((modulo, idx) => (
        <ModuloRow
          key={modulo.moduloId}
          modulo={modulo}
          numero={idx + 1}
          onAbrirSeccion={onAbrirSeccion}
        />
      ))}
    </ul>
  )
}

interface ModuloRowProps {
  readonly modulo: ModuloPlanParticipante
  readonly numero: number
  readonly onAbrirSeccion: (seccionId: string) => void
}

function calcularAvanceModulo(secciones: readonly SeccionPlanItemParticipante[]): number {
  const obligatorias = secciones.filter((s) => s.caracter === "OBLIGATORIA")
  if (obligatorias.length === 0) {
    return 100
  }
  const completadas = obligatorias.filter((s) => s.completada).length
  return Math.round((completadas / obligatorias.length) * 100)
}

function ModuloRow({ modulo, numero, onAbrirSeccion }: ModuloRowProps) {
  const avance = calcularAvanceModulo(modulo.secciones)
  const todoCompleto = avance === 100
  const [expandido, setExpandido] = useState<boolean>(!todoCompleto)
  const Chevron = expandido ? ChevronDown : ChevronRight

  return (
    <li className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        aria-expanded={expandido}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-fast ease-default hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <Chevron className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
        <span className="min-w-0 flex-1 truncate text-body text-text-primary">
          M{numero}. {modulo.tituloModulo}
        </span>
        <span className="tabular shrink-0 text-caption text-text-secondary">{avance}%</span>
      </button>
      {expandido ? (
        <ul className="flex flex-col gap-0.5 border-border border-t px-2 py-2">
          {modulo.secciones.map((s) => (
            <FilaSeccion key={s.seccionId} seccion={s} onAbrir={onAbrirSeccion} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
