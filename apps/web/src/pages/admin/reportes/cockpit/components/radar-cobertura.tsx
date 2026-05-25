import { cn } from "@/shared/lib/cn"
import type {
  CoberturaColaboradorItem,
  CoberturaResumenAgregado,
  CoberturaSkillExigida,
} from "@nexott-learn/shared-types"
import { useMemo } from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"

interface RadarCoberturaProps {
  readonly skills: readonly CoberturaSkillExigida[]
  readonly resumen: CoberturaResumenAgregado
  readonly colaboradorSeleccionado: CoberturaColaboradorItem | null
  readonly className?: string
}

interface DataRadar {
  readonly skillId: string
  readonly etiqueta: string
  readonly target: number
  readonly individual: number | null
  readonly cohorte: number | null
}

/**
 * Radar dual de cobertura — target del curso (umbral cumple por skill) vs
 * nivel individual o promedio de la cohorte. Estilo NexoTT:
 * - grid en `border` token, sin chartreuse defaults
 * - capa target en `accent` (índigo) — exigencia
 * - capa real en `aurora-violet` con fill suave — desempeño
 * - sin tooltip — el contexto está en la leyenda y heatmap
 */
export function RadarCobertura({
  skills,
  resumen,
  colaboradorSeleccionado,
  className,
}: RadarCoberturaProps) {
  const promedioMap = useMemo(
    () => new Map(resumen.promedioPorSkill.map((p) => [p.skillId, p.promedio])),
    [resumen.promedioPorSkill],
  )

  const data: DataRadar[] = useMemo(() => {
    return skills.map((s) => {
      const notaIndividual = colaboradorSeleccionado
        ? (colaboradorSeleccionado.notas.find((n) => n.skillId === s.skillId)?.nota ?? null)
        : null
      return {
        skillId: s.skillId,
        etiqueta: s.etiqueta,
        target: s.notaMinima,
        individual: notaIndividual,
        cohorte: promedioMap.get(s.skillId) ?? null,
      }
    })
  }, [skills, promedioMap, colaboradorSeleccionado])

  if (skills.length < 3) {
    return (
      <div
        className={cn(
          "flex h-72 flex-col items-center justify-center rounded-2xl border border-border bg-subtle p-6 text-center",
          className,
        )}
      >
        <p className="text-body-sm text-text-secondary">
          El radar requiere 3 o más skills exigidas. Este curso tiene{" "}
          <span className="tabular font-mono font-semibold">{skills.length}</span>.
        </p>
        <p className="mt-1 text-caption text-text-tertiary">
          Revisa la matriz de cobertura abajo para esta vista.
        </p>
      </div>
    )
  }

  const modo = colaboradorSeleccionado ? "individual" : "cohorte"

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="var(--color-border)" strokeDasharray="2 4" />
            <PolarAngleAxis
              dataKey="etiqueta"
              tick={{
                fill: "var(--color-text-secondary)",
                fontSize: 11,
                fontFamily: "var(--font-sans)",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fill: "var(--color-text-tertiary)",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
              stroke="var(--color-border)"
              tickCount={5}
            />
            <Radar
              name="Umbral del curso"
              dataKey="target"
              stroke="var(--color-accent)"
              fill="var(--color-accent)"
              fillOpacity={0.06}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Radar
              name={modo === "individual" ? "Nivel individual" : "Promedio de la cohorte"}
              dataKey={modo}
              stroke="var(--color-aurora-violet)"
              fill="var(--color-aurora-violet)"
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-caption text-text-secondary">
        <li className="flex items-center gap-2">
          <span
            className="h-2 w-5 rounded-pill"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--color-accent) 0 4px, transparent 4px 8px)",
            }}
            aria-hidden={true}
          />
          Umbral del curso
        </li>
        <li className="flex items-center gap-2">
          <span
            className="h-2 w-5 rounded-pill bg-aurora-violet"
            style={{ opacity: 0.85 }}
            aria-hidden={true}
          />
          {modo === "individual"
            ? (colaboradorSeleccionado?.nombre ?? "Individual")
            : "Promedio cohorte"}
        </li>
      </ul>
    </div>
  )
}
