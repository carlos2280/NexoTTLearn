import { useObtenerContenido } from "@/features/admin-contenidos/hooks/use-obtener-contenido"
import type { ContenidoEmbebido, TipoContenido } from "@nexott-learn/shared-types"
import { BloqueLectura } from "./bloque-lectura"
import { BloqueLoading } from "./bloque-loading"
import { BloquePlaceholder } from "./bloque-placeholder"
import { BloqueRecurso } from "./bloque-recurso"
import { BloqueVideo } from "./bloque-video"

interface BloqueRouterProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly bloque: ContenidoEmbebido
}

function necesitaDetalleParaTipo(tipo: TipoContenido): boolean {
  return tipo === "LECTURA" || tipo === "VIDEO" || tipo === "RECURSO"
}

// Router por tipo de bloque. Antes de delegar al editor concreto, carga el
// payload completo (`contenido`) que el listado embebido NO incluye. El cache
// de React Query retiene el detalle por id mientras el bloque exista en el
// canvas, asi que el coste es 1 GET inicial por bloque visible.
export function BloqueRouter({ cursoId, moduloId, seccionId, bloque }: BloqueRouterProps) {
  const tipo: TipoContenido = bloque.tipo
  const necesitaDetalle = necesitaDetalleParaTipo(tipo)

  const detalleQuery = useObtenerContenido(cursoId, moduloId, seccionId, bloque.id, {
    enabled: necesitaDetalle,
  })

  switch (tipo) {
    case "LECTURA": {
      if (detalleQuery.isLoading || !detalleQuery.data) {
        return <BloqueLoading />
      }
      return (
        <BloqueLectura
          cursoId={cursoId}
          moduloId={moduloId}
          seccionId={seccionId}
          contenidoId={bloque.id}
          contenidoRaw={detalleQuery.data.contenido}
        />
      )
    }
    case "VIDEO": {
      if (detalleQuery.isLoading || !detalleQuery.data) {
        return <BloqueLoading />
      }
      return (
        <BloqueVideo
          cursoId={cursoId}
          moduloId={moduloId}
          seccionId={seccionId}
          contenidoId={bloque.id}
          contenidoRaw={detalleQuery.data.contenido}
        />
      )
    }
    case "RECURSO": {
      if (detalleQuery.isLoading || !detalleQuery.data) {
        return <BloqueLoading />
      }
      return (
        <BloqueRecurso
          cursoId={cursoId}
          moduloId={moduloId}
          seccionId={seccionId}
          contenidoId={bloque.id}
          contenidoRaw={detalleQuery.data.contenido}
        />
      )
    }
    case "EJEMPLO_CODIGO":
    case "EJERCICIO":
    case "TEST":
      return <BloquePlaceholder tipo={tipo} />
    default: {
      const _never: never = tipo
      return _never
    }
  }
}
