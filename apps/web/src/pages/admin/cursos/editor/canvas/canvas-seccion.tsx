import { useBloques, useCrearBloque } from "@/features/admin-cursos/hooks/use-editor-curso"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import { BlockRenderer } from "@/shared/ui/patterns/immersive/block-renderers"
import { Button } from "@/shared/ui/primitives/button"
import type { CrearBloqueAdminInput, SeccionDetalleAdmin } from "@nexott-learn/shared-types"
import { Plus } from "lucide-react"
import { useCallback, useState } from "react"
import { useKeyShortcut } from "../hooks/use-key-shortcut"
import { InsertBloqueMenu } from "./insert-bloque-menu"

interface CanvasSeccionProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccion: SeccionDetalleAdmin
  readonly selectedBloqueId: string | null
  readonly onSelectBloque: (bloqueId: string) => void
}

export function CanvasSeccion({
  cursoId,
  moduloId,
  seccion,
  selectedBloqueId,
  onSelectBloque,
}: CanvasSeccionProps) {
  const bloquesQuery = useBloques(cursoId, moduloId, seccion.id)
  const crearBloque = useCrearBloque(cursoId, moduloId, seccion.id)
  const [insertOpen, setInsertOpen] = useState(false)
  const bloques = bloquesQuery.data ?? []

  const insertBloque = (input: CrearBloqueAdminInput) => {
    crearBloque.mutate(input, {
      onSuccess: (creado) => {
        onSelectBloque(creado.id)
        setInsertOpen(false)
      },
    })
  }

  const abrirInsertar = useCallback(() => setInsertOpen(true), [])
  useKeyShortcut({ key: "/", enabled: !insertOpen, onTrigger: abrirInsertar })

  return (
    <BlockCanvas
      title={seccion.titulo}
      meta={
        <span>
          {bloques.length} bloques · {seccion.evaluablesCount} evaluables
        </span>
      }
      footer={
        <div className="flex flex-col gap-2">
          {insertOpen ? (
            <InsertBloqueMenu onPick={insertBloque} onCancel={() => setInsertOpen(false)} />
          ) : (
            <Button variant="outline" full={true} onClick={abrirInsertar} className="border-dashed">
              <Plus className="size-4" />
              Insertar bloque (o presiona /)
            </Button>
          )}
        </div>
      }
    >
      {bloquesQuery.isLoading ? (
        <SeccionSkeleton />
      ) : bloques.length === 0 && !insertOpen ? (
        <div className="rounded-[var(--radius-lg)] border border-glass-border border-dashed bg-glass-1 px-6 py-12 text-center">
          <p className="font-medium text-sm text-text-primary">Sección vacía</p>
          <p className="mt-1 text-text-muted text-xs">
            Empieza insertando un bloque desde el botón inferior, o presiona <kbd>/</kbd>.
          </p>
        </div>
      ) : (
        bloques.map((bloque) => (
          <BlockRenderer
            key={bloque.id}
            bloque={bloque}
            mode="edit"
            selected={selectedBloqueId === bloque.id}
            onSelect={onSelectBloque}
          />
        ))
      )}
    </BlockCanvas>
  )
}

function SeccionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-glass-1" />
      ))}
    </div>
  )
}
