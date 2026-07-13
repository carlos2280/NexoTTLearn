import { Badge } from "@/shared/components/ui/badge"
import type { RevisionIa } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { CumplimientoCriterios } from "./cumplimiento-criterios"
import { DimensionesRevisionIa } from "./dimensiones-revision-ia"
import { ListasRevisionIa } from "./listas-revision-ia"

interface InformeRevisionIaProps {
  readonly revision: RevisionIa
  readonly nota: number | null
  readonly umbral: number
}

function confianzaLabel(confianza: RevisionIa["confianza"]): string {
  if (confianza === "ALTA") {
    return "Alta"
  }
  return confianza === "MEDIA" ? "Media" : "Baja"
}

/**
 * Render de solo lectura del informe "Revisión con IA". El `veredicto` viene
 * derivado del backend (nota vs umbral); la IA no lo decide. Todos los campos
 * ricos son opcionales: un informe legacy (solo comentario) también renderiza.
 */
export function InformeRevisionIa({ revision, nota, umbral }: InformeRevisionIaProps) {
  const dimensiones = revision.porDimension ?? []
  // `||` (no `??`): un resumen presente pero vacío ("") debe caer al comentario.
  const resumen = revision.resumen || revision.comentario
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Veredicto veredicto={revision.veredicto} />
        <Dato etiqueta="Nota IA">
          <span className="tabular text-h2 text-text-primary leading-tight">
            {nota === null ? "—" : nota}
            {nota !== null ? (
              <span className="ml-1 text-body-sm text-text-tertiary">/100</span>
            ) : null}
          </span>
        </Dato>
        <Dato etiqueta="Confianza">
          <span className="text-body text-text-primary">{confianzaLabel(revision.confianza)}</span>
        </Dato>
        <Dato etiqueta="Umbral">
          <span className="tabular text-body text-text-primary">{umbral}/100</span>
        </Dato>
      </div>

      {resumen ? <p className="text-body-sm text-text-secondary">{resumen}</p> : null}

      {dimensiones.length > 0 ? <DimensionesRevisionIa dimensiones={dimensiones} /> : null}

      <CumplimientoCriterios criterios={revision.cumplimientoCriterios ?? []} />

      <ListasRevisionIa
        fortalezas={revision.fortalezas ?? []}
        aReforzar={revision.aReforzar ?? []}
      />

      {revision.queReviso || revision.queNoReviso ? (
        <div className="flex flex-col gap-1 border-border border-t pt-3 text-caption text-text-tertiary">
          {revision.queReviso ? <span>Revisó: {revision.queReviso}</span> : null}
          {revision.queNoReviso ? <span>No revisó: {revision.queNoReviso}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

function Veredicto({ veredicto }: { readonly veredicto: RevisionIa["veredicto"] }) {
  if (veredicto === "apto") {
    return (
      <Badge variant="soft" tono="success" conPunto={false}>
        Apto
      </Badge>
    )
  }
  if (veredicto === "necesita_ajustes") {
    return (
      <Badge variant="soft" tono="warning" conPunto={false}>
        Necesita ajustes
      </Badge>
    )
  }
  return null
}

function Dato({
  etiqueta,
  children,
}: {
  readonly etiqueta: string
  readonly children: ReactNode
}) {
  return (
    <div className="flex flex-col">
      <span className="text-caption text-text-tertiary">{etiqueta}</span>
      {children}
    </div>
  )
}
