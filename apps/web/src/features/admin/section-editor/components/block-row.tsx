import { useActualizarContenido } from "@/features/admin-contenidos/hooks/use-actualizar-contenido"
import {
  NxlBlockShell,
  type NxlBlockShellAction,
  type NxlBlockShellTipo,
} from "@carlos2280/nexott-ui/learn/react"
import { toast } from "@carlos2280/nexott-ui/react"
import type { ContenidoEmbebido } from "@nexott-learn/shared-types"
import { useEffect, useRef, useState } from "react"
import { BloqueRouter } from "../blocks/bloque-router"
import { useAutoSave } from "../hooks/use-auto-save"

interface BlockRowProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly bloque: ContenidoEmbebido
  readonly defaultCollapsed: boolean
  readonly onAction: (action: NxlBlockShellAction, bloque: ContenidoEmbebido) => void
}

// Fila de bloque editable. Vive dentro de <NxtSortableList> en el canvas.
// Maneja:
//  - Estado collapsed local (default por tipo lo decide el padre).
//  - Auto-save inline del titulo via useAutoSave + actualizarContenido.
//  - Acciones del menu — rename, duplicate, archive/restore, delete — las
//    delega al canvas (que centraliza dialogos y mutaciones secundarias).
export function BlockRow({
  cursoId,
  moduloId,
  seccionId,
  bloque,
  defaultCollapsed,
  onAction,
}: BlockRowProps) {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed)
  const [titulo, setTitulo] = useState<string>(bloque.titulo)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Sincroniza el draft con cambios externos del cache (otra sesion edita,
  // invalidacion del back).
  useEffect(() => {
    setTitulo(bloque.titulo)
  }, [bloque.titulo])

  const actualizarMutation = useActualizarContenido()

  useAutoSave({
    value: titulo.trim(),
    initial: bloque.titulo.trim(),
    save: async (next) => {
      if (next.length === 0) {
        toast.error("El titulo no puede quedar vacio")
        throw new Error("titulo vacio")
      }
      await actualizarMutation.mutateAsync({
        cursoId,
        moduloId,
        seccionId,
        contenidoId: bloque.id,
        input: { titulo: next },
      })
    },
  })

  return (
    <NxlBlockShell
      blockId={bloque.id}
      tipo={bloque.tipo as NxlBlockShellTipo}
      title={titulo}
      duration={bloque.duracionEstimada ?? undefined}
      collapsed={collapsed}
      archived={bloque.archivado}
      onNxlBlockToggle={(e) => setCollapsed(e.detail.collapsed)}
      onNxlBlockActionClick={(e) => {
        if (e.detail.action === "rename") {
          // Afordancia "rename": expandimos si esta colapsado y ponemos el
          // foco en el input del titulo. F4.2 lo movera a un editor inline
          // dentro del header del shell.
          if (collapsed) {
            setCollapsed(false)
          }
          // Defer al siguiente tick para que el render expandido pinte.
          setTimeout(() => inputRef.current?.focus(), 0)
          return
        }
        onAction(e.detail.action, bloque)
      }}
    >
      <input
        ref={inputRef}
        className="section-editor__title-input"
        type="text"
        value={titulo}
        placeholder="Titulo del bloque"
        aria-label="Titulo del bloque"
        maxLength={200}
        onChange={(e) => setTitulo(e.target.value)}
      />
      <BloqueRouter cursoId={cursoId} moduloId={moduloId} seccionId={seccionId} bloque={bloque} />
    </NxlBlockShell>
  )
}
