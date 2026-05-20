import { useListarCursos } from "@/features/cursos/hooks/use-listar-cursos"
import { useCoberturaCurso } from "@/features/reportes/hooks/use-cobertura-curso"
import { Card } from "@/shared/components/ui/card"
import { Select, SelectItem } from "@/shared/components/ui/select"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useEffect, useMemo, useState } from "react"
import { HeatmapCobertura } from "./heatmap-cobertura"
import { LeyendaNiveles } from "./leyenda-niveles"
import { RadarCobertura } from "./radar-cobertura"
import { ResumenCohorte } from "./resumen-cohorte"

export function SeccionCoberturaCurso() {
  const cursosQuery = useListarCursos({
    page: 1,
    pageSize: 100,
    sort: "titulo",
    estado: "ACTIVO",
    incluirArchivados: false,
  })
  const cursos = cursosQuery.data?.data ?? []

  const [cursoId, setCursoId] = useState<string | null>(null)
  const [colaboradorId, setColaboradorId] = useState<string | null>(null)

  useEffect(() => {
    if (cursoId === null && cursos.length > 0) {
      setCursoId(cursos[0]?.id ?? null)
    }
  }, [cursoId, cursos])

  const coberturaQuery = useCoberturaCurso(cursoId ? { cursoId } : null)
  const data = coberturaQuery.data

  const colaboradorSeleccionado = useMemo(() => {
    if (!(data && colaboradorId)) {
      return null
    }
    return data.colaboradores.find((c) => c.id === colaboradorId) ?? null
  }, [data, colaboradorId])

  return (
    <Card tono="plano" densidad="generosa" className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-aurora-violet">Cobertura por curso</span>
          <h2 className="text-h2 text-text-primary">
            Mapa de skills del curso<span className="text-aurora-violet">.</span>
          </h2>
          <p className="max-w-[600px] text-body-sm text-text-secondary">
            Selecciona un curso para ver el radar de cobertura y la matriz de colaboradores × skill.
            Haz clic en una fila del heatmap para enfocar el radar en una persona.
          </p>
        </div>
        <div className="w-full max-w-[320px]">
          <Select
            value={cursoId ?? undefined}
            onValueChange={(v) => {
              setCursoId(v)
              setColaboradorId(null)
            }}
            placeholder={cursosQuery.isLoading ? "Cargando cursos…" : "Selecciona un curso"}
            aria-label="Curso a analizar"
          >
            {cursos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.titulo}
              </SelectItem>
            ))}
          </Select>
        </div>
      </header>

      {coberturaQuery.isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ResumenCohorte resumen={data.resumen} total={data.colaboradores.length} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="nx-eyebrow text-text-tertiary">
                  {colaboradorSeleccionado ? "Vista individual" : "Vista cohorte"}
                </span>
                {colaboradorSeleccionado ? (
                  <button
                    type="button"
                    onClick={() => setColaboradorId(null)}
                    className="cursor-pointer text-aurora-violet text-caption hover:underline"
                  >
                    Volver a cohorte
                  </button>
                ) : null}
              </div>
              <RadarCobertura
                skills={data.skills}
                resumen={data.resumen}
                colaboradorSeleccionado={colaboradorSeleccionado}
              />
            </div>

            <div className="flex flex-col gap-3">
              <span className="nx-eyebrow text-text-tertiary">Matriz colaborador × skill</span>
              <HeatmapCobertura
                skills={data.skills}
                colaboradores={data.colaboradores}
                seleccionadoId={colaboradorId}
                onSeleccionar={setColaboradorId}
              />
              <LeyendaNiveles />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
