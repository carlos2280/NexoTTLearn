import type {
  CursoArbolSeccion,
  ModoCursoParticipante,
  SeccionPlanItemParticipante,
} from "@nexott-learn/shared-types"
import { FilaSeccion } from "./fila-seccion"

interface ModuloGrupoProps {
  readonly titulo: string
  readonly secciones: readonly CursoArbolSeccion[]
  readonly planById: ReadonlyMap<string, SeccionPlanItemParticipante>
  readonly modo: ModoCursoParticipante
  readonly seccionActivaId: string | null
  readonly onSeleccionar: (seccionId: string) => void
  readonly seccionesAbiertasSet: ReadonlySet<string>
  readonly soloLectura: boolean
}

/**
 * Grupo "modulo" del sidebar — titulo + lista de filas de secciones del
 * catalogo. Pinta cada seccion mediante `FilaSeccion`, que decide su estado
 * en base al modo y al plan personal (si lo hay).
 */
export function ModuloGrupo({
  titulo,
  secciones,
  planById,
  modo,
  seccionActivaId,
  onSeleccionar,
  seccionesAbiertasSet,
  soloLectura,
}: ModuloGrupoProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-2 font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
        {titulo}
      </h3>
      <ul className="flex flex-col gap-1">
        {secciones.map((seccion) => {
          const plan = planById.get(seccion.seccionId) ?? null
          return (
            <FilaSeccion
              key={seccion.seccionId}
              titulo={seccion.titulo}
              seccionId={seccion.seccionId}
              modo={modo}
              plan={plan}
              abiertaPorAperturas={seccionesAbiertasSet.has(seccion.seccionId)}
              activa={seccion.seccionId === seccionActivaId}
              onSeleccionar={onSeleccionar}
              soloLectura={soloLectura}
            />
          )
        })}
      </ul>
    </section>
  )
}
