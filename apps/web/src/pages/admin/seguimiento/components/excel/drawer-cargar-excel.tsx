import { useConfirmarExcel } from "@/features/admin-seguimiento/hooks/use-confirmar-excel"
import { usePreviewExcel } from "@/features/admin-seguimiento/hooks/use-preview-excel"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/shared/ui/patterns/drawer"
import { Button } from "@/shared/ui/primitives/button"
import type { ExcelPreviewResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, XCircle } from "lucide-react"
import type { DragEvent as ReactDragEvent } from "react"
import { useCallback, useState } from "react"
import { PreviewTabla } from "./preview-tabla"

interface DrawerCargarExcelProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly cursoId: string
  readonly onConfirmado: () => void
}

type Paso = "drop" | "preview" | "guardando" | "ok"

export function DrawerCargarExcel({
  open,
  onClose,
  cursoId,
  onConfirmado,
}: DrawerCargarExcelProps) {
  const [paso, setPaso] = useState<Paso>("drop")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<ExcelPreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const previewMut = usePreviewExcel()
  const confirmarMut = useConfirmarExcel()

  const reset = useCallback(() => {
    setPaso("drop")
    setArchivo(null)
    setPreview(null)
    setError(null)
    previewMut.reset()
    confirmarMut.reset()
  }, [previewMut, confirmarMut])

  const handleFile = useCallback(
    (file: File) => {
      setArchivo(file)
      setError(null)
      previewMut.mutate(
        { cursoId, archivo: file },
        {
          onSuccess: (r) => {
            setPreview(r)
            setPaso("preview")
          },
          onError: (e) => {
            setError(e.message)
          },
        },
      )
    },
    [cursoId, previewMut],
  )

  const handleDrop = (e: ReactDragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) {
      handleFile(f)
    }
  }

  const handleConfirmar = () => {
    if (!preview) {
      return
    }
    setPaso("guardando")
    confirmarMut.mutate(
      { cursoId, uploadId: preview.uploadId },
      {
        onSuccess: () => {
          setPaso("ok")
          // Pequena demora para que el usuario vea el feedback de exito antes
          // de que el drawer se cierre y la matriz se refresque.
          setTimeout(() => {
            onConfirmado()
            onClose()
            reset()
          }, 1200)
        },
        onError: (e) => {
          setError(e.message)
          setPaso("preview")
        },
      },
    )
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 300)
  }

  const cargandoPreview = previewMut.isPending

  return (
    <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
      <DrawerContent
        title="Cargar Excel de evaluación inicial"
        header={
          <DrawerHeader>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted text-xs uppercase tracking-wider">
                Paso {paso === "drop" ? 1 : paso === "preview" ? 2 : 3} de 3
              </span>
              <h3 className="font-semibold text-base text-text-primary tracking-tight">
                Cargar evaluación inicial
              </h3>
              <span className="text-text-muted text-xs">
                {paso === "drop" && "Arrastra el Excel completado o selecciónalo"}
                {paso === "preview" && "Revisa filas válidas y errores antes de confirmar"}
                {(paso === "guardando" || paso === "ok") && "Procesando…"}
              </span>
            </div>
          </DrawerHeader>
        }
        footer={
          paso === "preview" && preview ? (
            <DrawerFooter>
              <div className="flex justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={reset} disabled={confirmarMut.isPending}>
                  Cancelar y volver
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmar}
                  disabled={
                    preview.resumen.ok + preview.resumen.warnings === 0 || confirmarMut.isPending
                  }
                >
                  Confirmar carga · {preview.resumen.ok + preview.resumen.warnings} filas
                </Button>
              </div>
            </DrawerFooter>
          ) : null
        }
      >
        <DrawerBody>
          {paso === "drop" && (
            <DropZone
              drag={drag}
              setDrag={setDrag}
              onDrop={handleDrop}
              onPickFile={handleFile}
              error={error}
              cargando={cargandoPreview}
            />
          )}
          {paso === "preview" && preview && (
            <>
              {error && (
                <div className="mb-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[rgb(244_63_94/0.3)] bg-[var(--danger-bg)] p-3 text-danger text-sm">
                  <XCircle className="size-4 shrink-0" strokeWidth={2} />
                  <span>{error}</span>
                </div>
              )}
              <PreviewTabla preview={preview} archivo={archivo} />
            </>
          )}
          {paso === "guardando" && <EstadoCargando />}
          {paso === "ok" && <EstadoExito />}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

interface DropZoneProps {
  readonly drag: boolean
  readonly setDrag: (v: boolean) => void
  readonly onDrop: (e: ReactDragEvent) => void
  readonly onPickFile: (f: File) => void
  readonly error: string | null
  readonly cargando: boolean
}

function DropZone({ drag, setDrag, onDrop, onPickFile, error, cargando }: DropZoneProps) {
  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="excel-input"
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed py-14 transition-colors ${
          drag
            ? "border-brand-violet bg-[var(--brand-violet)]/10"
            : "border-glass-border-strong bg-glass-1 hover:border-brand-violet/50 hover:bg-glass-2"
        }`}
      >
        {cargando ? (
          <Loader2 className="size-10 animate-spin text-brand-violet" strokeWidth={1.5} />
        ) : (
          <UploadCloud className="size-10 text-brand-violet" strokeWidth={1.5} />
        )}
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium text-sm text-text-primary">
            {cargando ? "Procesando archivo…" : "Arrastra el archivo o click para seleccionar"}
          </span>
          <span className="text-text-muted text-xs">.xlsx · máximo 10 MB</span>
        </div>
        <input
          id="excel-input"
          type="file"
          accept=".xlsx"
          className="hidden"
          disabled={cargando}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              onPickFile(f)
            }
          }}
        />
      </label>
      {error && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[rgb(244_63_94/0.3)] bg-[var(--danger-bg)] p-3 text-danger text-sm">
          <XCircle className="size-4 shrink-0" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-3 text-text-secondary text-xs">
        <FileSpreadsheet className="size-4 shrink-0 text-text-muted" strokeWidth={1.75} />
        <span>
          Si aún no tienes la plantilla, vuelve y descárgala desde el botón{" "}
          <strong>Plantilla</strong>.
        </span>
      </div>
    </div>
  )
}

function EstadoCargando() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="size-10 animate-spin text-brand-violet" strokeWidth={1.5} />
      <span className="font-medium text-sm text-text-primary">Procesando carga…</span>
      <span className="text-text-muted text-xs">Aplicando notas en el servidor</span>
    </div>
  )
}

function EstadoExito() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--success-bg)]">
        <CheckCircle2 className="size-7 text-success" strokeWidth={2} />
      </div>
      <span className="font-medium text-sm text-text-primary">Carga aplicada con éxito</span>
      <span className="text-text-muted text-xs">La matriz se actualizará en un segundo</span>
    </div>
  )
}
