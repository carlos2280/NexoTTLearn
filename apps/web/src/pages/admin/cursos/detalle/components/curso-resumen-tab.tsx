import { useEntrevistaIa } from "@/features/admin-cursos/hooks/use-entrevista-ia"
import { useProyectoTransversal } from "@/features/admin-cursos/hooks/use-proyecto-transversal"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { AreasCard } from "./areas-card"
import { EntrevistaIACard } from "./entrevista-ia-card"
import { PesosCursoCard, PesosIntraModuloCard } from "./pesos-curso-card"
import { TransversalCard } from "./transversal-card"
import { UmbralesCard } from "./umbrales-card"

interface CursoResumenTabProps {
  readonly curso: CursoDetalle
}

export function CursoResumenTab({ curso }: CursoResumenTabProps) {
  const transversalActivo = curso.proyectoTransversal.activo
  const entrevistaActiva = curso.entrevistaIAConfig.activa
  const transversalQuery = useProyectoTransversal(curso.id, transversalActivo)
  const entrevistaQuery = useEntrevistaIa(curso.id, entrevistaActiva)

  return (
    <div className="flex flex-col gap-6">
      <AreasCard areas={curso.cursoAreas} />
      <div className="grid gap-6 xl:grid-cols-2">
        <PesosCursoCard curso={curso} />
        <PesosIntraModuloCard curso={curso} />
      </div>
      <UmbralesCard curso={curso} />
      <div className="grid gap-6 xl:grid-cols-2">
        <TransversalCard
          activo={transversalActivo}
          transversal={transversalQuery.data}
          loading={transversalQuery.isLoading}
          error={transversalQuery.error}
        />
        <EntrevistaIACard
          activa={entrevistaActiva}
          entrevista={entrevistaQuery.data}
          loading={entrevistaQuery.isLoading}
          error={entrevistaQuery.error}
        />
      </div>
    </div>
  )
}
