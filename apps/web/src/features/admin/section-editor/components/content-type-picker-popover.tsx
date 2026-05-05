import { useCrearContenido } from "@/features/admin-contenidos/hooks/use-crear-contenido"
import { ApiError } from "@/shared/api/api-error"
import { type NxlBlockShellTipo, NxlContentTypePicker } from "@carlos2280/nexott-ui/learn/react"
import { toast } from "@carlos2280/nexott-ui/react"
import type { TipoContenido } from "@nexott-learn/shared-types"
import { useEffect, useRef } from "react"

interface ContentTypePickerPopoverProps {
  readonly open: boolean
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly onClose: () => void
  readonly onCreated?: () => void
}

// Funcion en vez de Record para evitar el lint useNamingConvention sobre
// keys UPPER_CASE del enum TipoContenido.
function defaultTituloDeTipo(tipo: TipoContenido): string {
  switch (tipo) {
    case "LECTURA":
      return "Nueva lectura"
    case "VIDEO":
      return "Nuevo video"
    case "RECURSO":
      return "Nuevo recurso"
    case "EJEMPLO_CODIGO":
      return "Nuevo ejemplo de codigo"
    case "EJERCICIO":
      return "Nuevo ejercicio"
    case "TEST":
      return "Nuevo test"
    default:
      return "Nuevo bloque"
  }
}

// Orquesta <NxlContentTypePicker> (popover) + mutacion de crear contenido.
// Cierra outside-click y al seleccionar un tipo.
export function ContentTypePickerPopover({
  open,
  cursoId,
  moduloId,
  seccionId,
  onClose,
  onCreated,
}: ContentTypePickerPopoverProps) {
  const crearMutation = useCrearContenido()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Outside-click manual: el popover vive en light DOM dentro del anchor;
  // si el usuario clickea fuera, cerramos.
  useEffect(() => {
    if (!open) {
      return
    }
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) {
        return
      }
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        onClose()
      }
    }
    // Defer al siguiente tick para no captar el mismo click que abrio el popover.
    const id = setTimeout(() => document.addEventListener("click", onDocClick), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener("click", onDocClick)
    }
  }, [open, onClose])

  const handleSelect = (tipo: NxlBlockShellTipo): void => {
    const tipoBack = tipo as TipoContenido
    const titulo = defaultTituloDeTipo(tipoBack)
    crearMutation.mutate(
      {
        cursoId,
        moduloId,
        seccionId,
        input: { tipo: tipoBack, titulo },
      },
      {
        onSuccess: () => {
          toast.success("Bloque creado")
          onClose()
          onCreated?.()
        },
        onError: (error) => {
          toast.error(mensajeDeError(error, "crear el bloque"))
        },
      },
    )
  }

  return (
    <div ref={wrapperRef} className="section-editor__picker-floating">
      <NxlContentTypePicker
        open={open}
        onNxlContentTypePickerSelect={(e) => handleSelect(e.detail.tipo)}
        onNxlContentTypePickerClose={onClose}
      />
    </div>
  )
}

function mensajeDeError(error: unknown, accion: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return `No pudimos ${accion}. Reintenta en unos segundos.`
}
