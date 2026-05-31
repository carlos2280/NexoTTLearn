import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/cn"
import { type ChangeEvent, type DragEvent, useCallback, useRef, useState } from "react"

interface ZonaUploadProps {
  readonly onArchivo: (file: File) => Promise<void> | void
  readonly disabled?: boolean
}

/**
 * Drop zone + input file para seleccionar el `.md`. Acepta drag&drop y click.
 * No persiste estado del archivo — eso lo lleva el hook `use-archivo-md` en
 * la página, este componente solo es UI de selección.
 */
export function ZonaUpload({ onArchivo, disabled = false }: ZonaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const procesarArchivo = useCallback(
    async (file: File | undefined) => {
      if (file) {
        await onArchivo(file)
      }
    },
    [onArchivo],
  )

  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      await procesarArchivo(event.target.files?.[0])
      event.target.value = ""
    },
    [procesarArchivo],
  )

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragging(false)
      await procesarArchivo(event.dataTransfer.files[0])
    },
    [procesarArchivo],
  )

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) {
          setDragging(true)
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-base ease-default",
        dragging
          ? "border-accent bg-accent-soft"
          : "border-border-strong bg-subtle hover:border-accent",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <p className="text-body text-text-secondary">
        Arrastra tu archivo <code className="rounded bg-muted px-1.5 py-0.5 font-mono">.md</code>{" "}
        aquí o
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Seleccionar archivo
      </Button>
      <p className="text-caption text-text-tertiary">Máximo 2 MB</p>
    </div>
  )
}
