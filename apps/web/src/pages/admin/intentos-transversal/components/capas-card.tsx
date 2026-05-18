import { Button } from "@/shared/components/ui/button"
import type { IntentoTransversalAdminResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, Circle } from "lucide-react"
import { useState } from "react"
import { DialogCapaComprension } from "./dialog-capa-comprension"
import { DialogCapaCualitativa } from "./dialog-capa-cualitativa"
import { DialogCapaTests } from "./dialog-capa-tests"

type CapaId = "tests" | "cualitativa" | "comprension"

interface CapasCardProps {
  readonly intento: IntentoTransversalAdminResponse
}

interface CapaSpec {
  readonly id: CapaId
  readonly titulo: string
  readonly descripcion: string
}

const CAPAS: readonly CapaSpec[] = [
  {
    id: "tests",
    titulo: "Tests automatizados",
    descripcion: "Resultados del CI: cobertura, tests pasados/fallidos.",
  },
  {
    id: "cualitativa",
    titulo: "Análisis cualitativo",
    descripcion: "Análisis del código, claridad, decisiones técnicas.",
  },
  {
    id: "comprension",
    titulo: "Comprensión",
    descripcion: "Mini-entrevista IA sobre las decisiones del entregable.",
  },
]

/**
 * Sección principal de trabajo del admin: las 3 capas con su estado y un
 * botón "Cargar" o "Editar" que abre el dialog correspondiente. Si el intento
 * ya está FINALIZADO o ANULADO, las capas son solo lectura.
 */
export function CapasCard({ intento }: CapasCardProps) {
  const [abierto, setAbierto] = useState<CapaId | null>(null)
  const editable = intento.estado === "EN_EVALUACION" || intento.estado === "EVALUADO"

  function notaDeCapa(id: CapaId): number | null {
    if (id === "tests") {
      return intento.notaCapaTests
    }
    if (id === "cualitativa") {
      return intento.notaCapaCualitativa
    }
    return intento.notaCapaComprension
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Evaluación por capas</span>
        <h2 className="text-h3 text-text-primary">Carga las 3 capas antes de finalizar</h2>
      </div>
      <ul className="flex flex-col gap-3">
        {CAPAS.map((capa) => {
          const nota = notaDeCapa(capa.id)
          const cargada = nota !== null
          return (
            <li
              key={capa.id}
              className="flex items-start gap-3 rounded-lg border border-border p-4"
            >
              {cargada ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden={true} />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-text-tertiary" aria-hidden={true} />
              )}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-body text-text-primary">{capa.titulo}</h3>
                  <span className="tabular text-caption text-text-tertiary">
                    {cargada ? `${nota}/100` : "Pendiente"}
                  </span>
                </div>
                <p className="text-body-sm text-text-secondary">{capa.descripcion}</p>
              </div>
              <Button
                variant={cargada ? "ghost" : "secondary"}
                size="sm"
                onClick={() => setAbierto(capa.id)}
                disabled={!editable}
                title={editable ? undefined : "El intento ya está cerrado o anulado"}
              >
                {cargada ? "Editar" : "Cargar"}
              </Button>
            </li>
          )
        })}
      </ul>

      <DialogCapaTests
        abierto={abierto === "tests"}
        onCambiarAbierto={(v) => setAbierto(v ? "tests" : null)}
        intentoId={intento.intentoId}
        notaActual={intento.notaCapaTests}
      />
      <DialogCapaCualitativa
        abierto={abierto === "cualitativa"}
        onCambiarAbierto={(v) => setAbierto(v ? "cualitativa" : null)}
        intentoId={intento.intentoId}
        notaActual={intento.notaCapaCualitativa}
      />
      <DialogCapaComprension
        abierto={abierto === "comprension"}
        onCambiarAbierto={(v) => setAbierto(v ? "comprension" : null)}
        intentoId={intento.intentoId}
        notaActual={intento.notaCapaComprension}
      />
    </section>
  )
}
