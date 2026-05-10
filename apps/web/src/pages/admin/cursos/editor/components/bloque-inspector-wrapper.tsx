import { useBloques } from "@/features/admin-cursos/hooks/use-editor-curso"
import { InspectorBloque } from "../inspector/inspector-bloque"
import { InspectorStub } from "../inspector/inspector-stub"

interface BloqueInspectorWrapperProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly bloqueId: string
}

export function BloqueInspectorWrapper({
  cursoId,
  moduloId,
  seccionId,
  bloqueId,
}: BloqueInspectorWrapperProps) {
  const bloquesQuery = useBloques(cursoId, moduloId, seccionId)
  const bloque = bloquesQuery.data?.find((b) => b.id === bloqueId)
  if (!bloque) {
    return (
      <InspectorStub
        eyebrow="Bloque"
        title="No disponible"
        description="El bloque seleccionado ya no existe en esta sección."
      />
    )
  }
  return (
    <InspectorBloque bloque={bloque} cursoId={cursoId} moduloId={moduloId} seccionId={seccionId} />
  )
}
