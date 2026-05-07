import { useEliminarBloque } from "@/features/admin-cursos/hooks/use-editor-curso"
import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import { InspectorPanel, InspectorSection } from "@/shared/ui/patterns/immersive/inspector"
import { Button } from "@/shared/ui/primitives/button"
import type { BloqueDetalleAdmin } from "@nexott-learn/shared-types"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { CodigoControles } from "./inspector-bloque/codigo-controles"
import { tipoLabel } from "./inspector-bloque/types"

interface InspectorBloqueProps {
  readonly bloque: BloqueDetalleAdmin
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
}

export function InspectorBloque({ bloque, cursoId, moduloId, seccionId }: InspectorBloqueProps) {
  const eliminar = useEliminarBloque(cursoId, moduloId, seccionId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirmEliminar = () => {
    eliminar.mutate(bloque.id, {
      onSuccess: () => setConfirmOpen(false),
    })
  }

  return (
    <InspectorPanel
      eyebrow={tipoLabel(bloque.tipo)}
      title={`Bloque #${bloque.orden + 1}`}
      subtitle={
        <span className="text-text-muted">
          Edita el contenido en el canvas. Aquí solo metadata y acciones.
        </span>
      }
    >
      {bloque.tipo === "CODIGO" ? (
        <InspectorSection title="Comportamiento">
          <CodigoControles
            bloque={bloque}
            cursoId={cursoId}
            moduloId={moduloId}
            seccionId={seccionId}
          />
        </InspectorSection>
      ) : null}

      <InspectorSection title="Avanzado" defaultOpen={bloque.tipo !== "CODIGO"}>
        <Button
          variant="ghost"
          size="sm"
          full={true}
          onClick={() => setConfirmOpen(true)}
          disabled={eliminar.isPending}
        >
          <Trash2 className="size-3.5 text-danger" />
          <span className="text-danger">Eliminar bloque</span>
        </Button>
      </InspectorSection>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="danger"
        title="Eliminar bloque"
        description={
          <>
            Vas a eliminar este bloque de tipo <strong>{tipoLabel(bloque.tipo)}</strong>. Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar bloque"
        loading={eliminar.isPending}
        onConfirm={handleConfirmEliminar}
      />
    </InspectorPanel>
  )
}
