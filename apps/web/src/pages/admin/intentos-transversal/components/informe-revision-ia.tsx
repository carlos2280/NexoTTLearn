import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/lib/cn"
import type { RevisionIa } from "@nexott-learn/shared-types"
import { CumplimientoCriterios } from "./cumplimiento-criterios"
import { DimensionesRevisionIa } from "./dimensiones-revision-ia"
import { ListasRevisionIa } from "./listas-revision-ia"
import { CLASE_TEXTO_NOTA, estadoNota } from "./nota-umbral.helpers"

interface InformeRevisionIaProps {
  readonly revision: RevisionIa
  readonly nota: number | null
  readonly umbral: number
  /** Cuando la Nota global ya se muestra grande en otra card, la Nota IA baja de
   * tamaño para no competir con otro número gigante (MANIFIESTO ley 02). No se
   * ata a FINALIZADO: un intento anulado-ex-finalizado conserva su nota global. */
  readonly notaGlobalVisible: boolean
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
export function InformeRevisionIa({
  revision,
  nota,
  umbral,
  notaGlobalVisible,
}: InformeRevisionIaProps) {
  const dimensiones = revision.porDimension ?? []
  // `||` (no `??`): un resumen presente pero vacío ("") debe caer al comentario.
  const resumen = revision.resumen || revision.comentario
  return (
    <div className="flex flex-col gap-5">
      <CabeceraInforme
        revision={revision}
        nota={nota}
        umbral={umbral}
        notaGlobalVisible={notaGlobalVisible}
      />

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

/**
 * Cabecera del informe: la Nota IA como ancla (grande, coloreada vs umbral con
 * la capa "feedback") + el badge del veredicto; debajo, en tono callado,
 * confianza y umbral. Una jerarquía por pantalla (MANIFIESTO ley 02).
 */
function CabeceraInforme({
  revision,
  nota,
  umbral,
  notaGlobalVisible,
}: {
  readonly revision: RevisionIa
  readonly nota: number | null
  readonly umbral: number
  readonly notaGlobalVisible: boolean
}) {
  const tamano = nota === null ? "text-h3" : notaGlobalVisible ? "text-h2" : "text-display-md"
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn("tabular leading-none", tamano, CLASE_TEXTO_NOTA[estadoNota(nota, umbral)])}
        >
          {nota === null ? "—" : nota}
          {nota !== null ? (
            <span className="ml-1 text-body-sm text-text-tertiary">/100</span>
          ) : null}
        </span>
        <Veredicto veredicto={revision.veredicto} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
        <span>
          Confianza <span className="text-text-primary">{confianzaLabel(revision.confianza)}</span>
        </span>
        <span className="text-text-disabled" aria-hidden={true}>
          ·
        </span>
        <span className="tabular">Umbral {umbral}/100</span>
      </div>
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
