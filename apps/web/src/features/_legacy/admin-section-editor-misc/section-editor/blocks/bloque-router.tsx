import { useObtenerContenido } from "@/features/admin-contenidos/hooks/use-obtener-contenido"
import type { ContenidoEmbebido, TipoContenido } from "@nexott-learn/shared-types"
import type { ComponentType } from "react"
import { BloqueEjemploCodigo } from "./bloque-ejemplo-codigo"
import { BloqueEjercicio } from "./bloque-ejercicio"
import { BloqueLectura } from "./bloque-lectura"
import { BloqueLoading } from "./bloque-loading"
import { BloqueRecurso } from "./bloque-recurso"
import { BloqueTest } from "./bloque-test"
import { BloqueVideo } from "./bloque-video"

interface BloqueRouterProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly bloque: ContenidoEmbebido
}

interface BloqueDetalleProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly contenidoRaw: unknown
}

// Tipos cuyo editor recibe el payload completo desde el endpoint de detalle.
// Mantener sincronizado con `editoresConDetalle` — el assertion exhaustivo del
// switch de tipos en runtime garantiza que TipoContenido nuevos no pasen
// silenciosamente.
type TipoConDetalle = "LECTURA" | "VIDEO" | "RECURSO" | "EJEMPLO_CODIGO" | "EJERCICIO" | "TEST"

// Map (no objeto) para no chocar con useNamingConvention sobre las claves del
// enum TipoContenido, que son SCREAMING_CASE. El Map preserva el tipado del
// valor y permite el type-guard `has` sobre TipoContenido.
const editoresConDetalle = new Map<TipoConDetalle, ComponentType<BloqueDetalleProps>>([
  ["LECTURA", BloqueLectura],
  ["VIDEO", BloqueVideo],
  ["RECURSO", BloqueRecurso],
  ["EJEMPLO_CODIGO", BloqueEjemploCodigo],
  ["EJERCICIO", BloqueEjercicio],
  ["TEST", BloqueTest],
])

function tieneDetalle(tipo: TipoContenido): tipo is TipoConDetalle {
  return editoresConDetalle.has(tipo as TipoConDetalle)
}

// Router por tipo de bloque. Antes de delegar al editor concreto, carga el
// payload completo (`contenido`) que el listado embebido NO incluye. El cache
// de React Query retiene el detalle por id mientras el bloque exista en el
// canvas, asi que el coste es 1 GET inicial por bloque visible.
export function BloqueRouter({ cursoId, moduloId, seccionId, bloque }: BloqueRouterProps) {
  const tipo: TipoContenido = bloque.tipo

  const detalleQuery = useObtenerContenido(cursoId, moduloId, seccionId, bloque.id, {
    enabled: tieneDetalle(tipo),
  })

  if (tieneDetalle(tipo)) {
    if (detalleQuery.isLoading || !detalleQuery.data) {
      return <BloqueLoading />
    }
    // Sabemos que existe por el type-guard `tieneDetalle` previo.
    const Editor = editoresConDetalle.get(tipo) as ComponentType<BloqueDetalleProps>
    return (
      <Editor
        cursoId={cursoId}
        moduloId={moduloId}
        seccionId={seccionId}
        contenidoId={bloque.id}
        contenidoRaw={detalleQuery.data.contenido}
      />
    )
  }

  // Assertion exhaustivo: si TipoContenido crece y olvidamos cubrirlo aqui,
  // tsc fallara en compilacion antes de runtime.
  const _never: never = tipo
  return _never
}
