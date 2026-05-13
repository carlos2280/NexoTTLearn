import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Check, Copy, KeyRound } from "lucide-react"
import { useState } from "react"

interface PersonaCredencialDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly titulo: string
  readonly descripcion: string
  readonly nombre: string
  readonly email: string | null
  readonly passwordTemporal: string
  readonly caducaEn: string
}

function formatearFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
}

export function PersonaCredencialDialog({
  abierto,
  onCambiarAbierto,
  titulo,
  descripcion,
  nombre,
  email,
  passwordTemporal,
  caducaEn,
}: PersonaCredencialDialogProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(passwordTemporal)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      // Si el navegador bloquea clipboard, no rompemos el flujo.
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={titulo}
      descripcion={descripcion}
    >
      <div className="flex flex-col gap-4">
        <Banner tone="warning" title="Esta contraseña solo se muestra una vez">
          Cópiala ahora y entrégasela a {nombre} por un canal seguro. No quedará visible al cerrar.
        </Banner>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-subtle px-4 py-3">
          <span className="text-caption text-text-tertiary uppercase tracking-[0.18em]">
            Contraseña inicial
          </span>
          <div className="flex items-center gap-3">
            <code className="tabular flex-1 truncate font-mono text-body-lg text-text-primary">
              {passwordTemporal}
            </code>
            <Button variant="secondary" size="sm" type="button" onClick={copiar}>
              {copiado ? (
                <>
                  <Check className="h-4 w-4" aria-hidden={true} /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden={true} /> Copiar
                </>
              )}
            </Button>
          </div>
        </div>
        {email ? (
          <div className="flex items-center gap-2 text-body-sm text-text-secondary">
            <KeyRound className="h-4 w-4 text-text-tertiary" aria-hidden={true} />
            <span>
              Entregar a <strong className="text-text-primary">{email}</strong>
            </span>
          </div>
        ) : null}
        <p className="text-caption text-text-tertiary">
          Caduca el {formatearFecha(caducaEn)}. El colaborador deberá cambiarla en su primer acceso.
        </p>
      </div>
      <DialogFooter>
        <Button variant="primary" size="sm" type="button" onClick={() => onCambiarAbierto(false)}>
          Entendido, cerrar
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
