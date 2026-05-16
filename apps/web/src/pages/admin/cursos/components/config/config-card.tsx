import { ApiError } from "@/shared/api/api-error"
import { type AyudaContenido, AyudaPopover } from "@/shared/components/ui/ayuda-popover"
import { Button } from "@/shared/components/ui/button"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface ConfigCardProps {
  readonly id?: string
  readonly titulo: string
  readonly descripcion: string
  readonly ayuda?: AyudaContenido
  readonly acciones?: ReactNode
  readonly exigeMotivo: boolean
  readonly modificado: boolean
  readonly enviando: boolean
  readonly deshabilitado?: boolean
  readonly mensajeDeshabilitado?: string
  readonly onGuardar: (motivo: string | undefined) => Promise<void>
  readonly onCancelar?: () => void
  readonly mensajeExito?: string
  readonly children: ReactNode
  readonly solicitudGuardar?: number
}

export function ConfigCard({
  id,
  titulo,
  descripcion,
  ayuda,
  acciones,
  exigeMotivo,
  modificado,
  enviando,
  deshabilitado,
  mensajeDeshabilitado,
  onGuardar,
  onCancelar,
  mensajeExito = "Cambios guardados",
  children,
  solicitudGuardar,
}: ConfigCardProps) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmadoRef = useRef(false)

  const puedeGuardar = modificado && !deshabilitado

  async function guardarDirecto() {
    setError(null)
    try {
      await onGuardar(undefined)
      toast.success(mensajeExito)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
  }

  async function guardarConMotivo(motivo: string) {
    setError(null)
    confirmadoRef.current = true
    try {
      await onGuardar(motivo)
      setDialogoAbierto(false)
      toast.success(mensajeExito)
    } catch (err) {
      confirmadoRef.current = false
      throw err
    }
  }

  function manejarCambioDialog(abierto: boolean) {
    const seCierraSinConfirmar = !(abierto || confirmadoRef.current)
    if (seCierraSinConfirmar) {
      onCancelar?.()
    }
    if (!abierto) {
      confirmadoRef.current = false
    }
    setDialogoAbierto(abierto)
  }

  async function manejarClick() {
    if (exigeMotivo) {
      setDialogoAbierto(true)
      return
    }
    await guardarDirecto()
  }

  // Disparo externo de guardar (typically desde un Switch atómico dentro de la card).
  // El padre incrementa `solicitudGuardar` y aquí lo detectamos para abrir el flujo.
  const ultimaSolicitudRef = useRef<number | undefined>(solicitudGuardar)
  const exigeMotivoRef = useRef(exigeMotivo)
  exigeMotivoRef.current = exigeMotivo
  const guardarDirectoRef = useRef(guardarDirecto)
  guardarDirectoRef.current = guardarDirecto
  useEffect(() => {
    if (solicitudGuardar === undefined) {
      return
    }
    if (ultimaSolicitudRef.current === solicitudGuardar) {
      return
    }
    ultimaSolicitudRef.current = solicitudGuardar
    if (exigeMotivoRef.current) {
      setDialogoAbierto(true)
    } else {
      guardarDirectoRef.current().catch(() => {
        // Errores se reportan dentro de guardarDirecto.
      })
    }
  }, [solicitudGuardar])

  return (
    <section
      id={id}
      className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-border bg-surface p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-h3 text-text-primary">{titulo}</h2>
            {ayuda ? (
              <AyudaPopover contenido={ayuda} etiquetaAria={`Ayuda sobre ${titulo}`} />
            ) : null}
          </div>
          <p className="text-body-sm text-text-secondary">{descripcion}</p>
        </div>
        {acciones ? <div className="shrink-0">{acciones}</div> : null}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
      {error ? (
        <p role="alert" className="text-body-sm text-danger-on-soft">
          {error}
        </p>
      ) : null}
      {deshabilitado && mensajeDeshabilitado ? (
        <p className="text-caption text-text-tertiary">{mensajeDeshabilitado}</p>
      ) : null}
      {puedeGuardar ? (
        <footer className="-mx-6 -mb-6 mt-2 flex items-center justify-end gap-3 border-border border-t bg-subtle/40 px-6 py-3">
          <span className="text-caption text-text-tertiary">Cambios sin guardar</span>
          <Button
            variant="primary"
            size="sm"
            type="button"
            isLoading={enviando && !exigeMotivo}
            onClick={manejarClick}
          >
            Guardar
          </Button>
        </footer>
      ) : null}

      {exigeMotivo ? (
        <ConfirmMotivoDialog
          abierto={dialogoAbierto}
          onCambiarAbierto={manejarCambioDialog}
          titulo="Confirmar cambios"
          descripcion={
            <>
              Vas a modificar la configuración de un curso{" "}
              <strong className="font-medium text-text-primary">no borrador</strong>. Esta acción
              queda registrada en el log auditable.
            </>
          }
          textoConfirmar="Confirmar cambios"
          placeholderMotivo="Indica el motivo del cambio…"
          enviando={enviando}
          onConfirmar={guardarConMotivo}
        />
      ) : null}
    </section>
  )
}
