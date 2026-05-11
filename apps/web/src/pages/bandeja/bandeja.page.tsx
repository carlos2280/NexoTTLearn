import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { Button } from "@/shared/components/ui/button"
import { Wordmark } from "@/shared/components/wordmark"
import { RUTAS } from "@/shared/constants/rutas"
import { useNavigate } from "react-router-dom"

export function BandejaPage() {
  const { data: usuario, isLoading } = useUsuarioActual()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-text-tertiary">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-border border-b bg-surface px-4 py-3 sm:px-6">
        <Wordmark variant="full" />
        <div className="flex items-center gap-2 sm:gap-3">
          {usuario ? (
            <span className="hidden text-body-sm text-text-secondary sm:inline">
              {usuario.nombre}
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => navigate(RUTAS.logout)}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-[1024px] flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-h2 text-text-primary">Hola, {usuario?.nombre ?? ""}</h1>
            <p className="text-body text-text-secondary">
              Esta es la bandeja. Aquí aterrizarán tus próximos pasos.
            </p>
          </div>
          <div className="rounded-md border border-border-strong border-dashed bg-surface p-8 text-center">
            <p className="text-body-sm text-text-tertiary">
              Pantalla en construcción — siguiente sprint del UX.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
