import type { SeccionListAdminResponse } from "@nexott-learn/shared-types"
import { InspectorSeccion } from "../inspector/inspector-seccion"
import { InspectorStub } from "../inspector/inspector-stub"
import { BloqueInspectorWrapper } from "./bloque-inspector-wrapper"

type Selected =
  | { readonly tipo: "seccion"; readonly moduloId: string; readonly seccionId: string }
  | {
      readonly tipo: "bloque"
      readonly moduloId: string
      readonly seccionId: string
      readonly bloqueId: string
    }

interface InspectorSeccionBloqueProps {
  readonly selected: Selected
  readonly cursoId: string
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
}

export function InspectorSeccionBloque({
  selected,
  cursoId,
  seccionesPorModulo,
}: InspectorSeccionBloqueProps) {
  const seccion = seccionesPorModulo
    .get(selected.moduloId)
    ?.find((s) => s.id === selected.seccionId)

  if (!seccion) {
    return (
      <InspectorStub
        eyebrow="Sección"
        title="No disponible"
        description="La sección seleccionada ya no existe."
      />
    )
  }

  if (selected.tipo === "seccion") {
    return <InspectorSeccion cursoId={cursoId} moduloId={selected.moduloId} seccion={seccion} />
  }

  return (
    <BloqueInspectorWrapper
      cursoId={cursoId}
      moduloId={selected.moduloId}
      seccionId={selected.seccionId}
      bloqueId={selected.bloqueId}
    />
  )
}
