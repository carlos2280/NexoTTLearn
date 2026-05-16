import { useCasosRevision } from "@/features/admin/dashboard/hooks/use-casos-revision"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Section } from "@/shared/components/ui/section"
import { RUTAS } from "@/shared/constants/rutas"
import { Link } from "react-router-dom"
import { EstadoCargando, EstadoError, EstadoVacio } from "./centro-revision/estados"
import { FilaCaso } from "./centro-revision/fila-caso"

export function CentroRevision() {
  const { casos, isLoading, error, refetch, totalPendientes } = useCasosRevision()
  const sobrantes = Math.max(0, totalPendientes - casos.length)

  return (
    <Section
      id="centro-revision"
      eyebrow="Bandeja de decisión"
      titulo="Centro de revisión"
      descripcion="Lo que está a punto de vencer o requiere que alguien decida."
      accion={
        <Button variant="ghost" size="sm" asChild={true}>
          <Link to={RUTAS.admin.cursos}>Ver todo</Link>
        </Button>
      }
    >
      <Card tono="plano" densidad="none">
        {error ? (
          <EstadoError onReintentar={refetch} />
        ) : isLoading ? (
          <EstadoCargando />
        ) : casos.length === 0 ? (
          <EstadoVacio />
        ) : (
          <>
            <ul className="flex flex-col gap-2 p-3">
              {casos.map((caso, i) => (
                <FilaCaso key={caso.id} caso={caso} indice={i} />
              ))}
            </ul>
            {sobrantes > 0 ? (
              <div className="border-border border-t px-5 py-3 text-caption text-text-tertiary">
                +{sobrantes} pendientes adicionales
              </div>
            ) : null}
          </>
        )}
      </Card>
    </Section>
  )
}
