import { useBloquesEvaluables } from "@/features/cursos/hooks/use-bloques-evaluables"
import { Banner } from "@/shared/components/ui/banner"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Code2 } from "lucide-react"
import { useMemo } from "react"
import { agruparRetosPorModulo, aplanarRetos } from "./agrupar-retos"
import { BarraValidacion } from "./barra-validacion"
import { GrupoModulo } from "./grupo-modulo"
import { construirInformeCurso, mensajeFinalValidacion, resumirCorrida } from "./reporte-reto"
import { ResumenCorridaBanner } from "./resumen-corrida"
import { useValidarRetosCurso } from "./use-validar-retos-curso"

interface PanelRetosProps {
  readonly cursoId: string
  readonly cursoTitulo: string
}

/**
 * Pestaña "Retos" del detalle de curso: valida en lote que la solución de
 * referencia de cada reto de código pase sus propias pruebas. Sin esto, un reto
 * roto de fábrica solo se descubre cuando un alumno pelea contra algo
 * imposible y reclama.
 *
 * Reusa `useBloquesEvaluables` (el mismo listado del subtab Evaluaciones →
 * Bloques): el backend ya devuelve todos los bloques evaluables del curso con
 * su módulo y sección, así que esta pantalla no necesitó endpoint nuevo.
 */
export function PanelRetos({ cursoId, cursoTitulo }: PanelRetosProps) {
  const { data, isLoading, error } = useBloquesEvaluables(cursoId)
  const { estados, progreso, deteniendo, validar, detener } = useValidarRetosCurso(cursoId)

  const grupos = useMemo(() => agruparRetosPorModulo(data ?? []), [data])
  const todos = useMemo(() => aplanarRetos(grupos), [grupos])
  const resumen = useMemo(() => resumirCorrida(grupos, estados), [grupos, estados])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Banner tone="danger" title="No pudimos cargar los retos">
        Vuelve a intentarlo en unos segundos. Si sigue fallando, revisa que el curso tenga módulos
        habilitados.
      </Banner>
    )
  }

  if (todos.length === 0) {
    return (
      <EmptyState
        tono="panel"
        icono={Code2}
        titulo="Este curso no tiene retos de código"
        descripcion="La validación automática cubre los bloques de tipo Reto de código. Los quiz y los ejercicios SQL se revisan desde el editor de cada módulo."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BarraValidacion
        totalRetos={todos.length}
        progreso={progreso}
        deteniendo={deteniendo}
        mensajeFinal={mensajeFinalValidacion(resumen)}
        onValidarTodos={() => {
          validar(todos)
        }}
        onDetener={detener}
      />
      {progreso === null ? (
        <ResumenCorridaBanner
          resumen={resumen}
          informe={construirInformeCurso(cursoTitulo, grupos, estados)}
        />
      ) : null}
      <ul className="flex flex-col gap-2">
        {grupos.map((grupo) => (
          <GrupoModulo
            key={grupo.moduloId}
            grupo={grupo}
            estados={estados}
            ocupado={progreso !== null}
            cursoTitulo={cursoTitulo}
            onValidar={() => {
              validar(grupo.retos)
            }}
          />
        ))}
      </ul>
    </div>
  )
}
