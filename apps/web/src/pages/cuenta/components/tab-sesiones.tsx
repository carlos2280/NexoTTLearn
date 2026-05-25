import { useCerrarOtrasSesiones } from "@/features/auth/hooks/use-cerrar-otras-sesiones"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog"
import { LogOut, Monitor } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function TabSesiones() {
  const [confirmando, setConfirmando] = useState(false)
  const mutacion = useCerrarOtrasSesiones()
  const apiError = mutacion.error instanceof ApiError ? mutacion.error : null

  async function ejecutar() {
    await mutacion.mutateAsync()
    toast.success("Otras sesiones cerradas")
    setConfirmando(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            <Monitor className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-h3 text-text-primary">Sesión actual</h2>
            <p className="text-body-sm text-text-secondary">
              Esta es la sesión desde la que navegas ahora. Si has iniciado sesión en otros
              dispositivos, puedes cerrarlas todas a la vez desde aquí.
            </p>
          </div>
        </header>
        {apiError ? <Banner tone="danger">{apiError.message}</Banner> : null}
        <div>
          <Button variant="secondary" size="sm" onClick={() => setConfirmando(true)}>
            <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Cerrar otras sesiones
          </Button>
        </div>
      </section>

      <ConfirmDialog
        abierto={confirmando}
        onCambiarAbierto={setConfirmando}
        titulo="Cerrar otras sesiones"
        descripcion="Cualquier dispositivo con tu sesión abierta tendrá que iniciar sesión de nuevo. Esta sesión actual no se cierra."
        textoConfirmar="Cerrar otras"
        enviando={mutacion.isPending}
        onConfirmar={ejecutar}
      />
    </div>
  )
}
