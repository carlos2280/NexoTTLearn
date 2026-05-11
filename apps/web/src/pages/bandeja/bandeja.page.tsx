import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { httpClient } from "@/shared/api/http-client"
import { Button } from "@/shared/components/ui/button"
import { Wordmark } from "@/shared/components/wordmark"
import { RUTAS } from "@/shared/constants/rutas"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

export function BandejaPage() {
  const { data: usuario, isLoading } = useUsuarioActual()
  const navigate = useNavigate()

  const logoutMutation = useMutation({
    mutationFn: () => httpClient.delete<void>("/auth/session"),
    onSuccess: () => {
      navigate(RUTAS.login, { replace: true })
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-[var(--color-text-tertiary)]">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-[var(--color-border)] border-b bg-[var(--color-surface)] px-6 py-3">
        <Wordmark variant="full" />
        <div className="flex items-center gap-3">
          {usuario ? (
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              {usuario.nombre} {usuario.apellido}
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            isLoading={logoutMutation.isPending}
          >
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto flex max-w-[1024px] flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-[24px] leading-8">Hola, {usuario?.nombre ?? ""}</h1>
            <p className="text-[14px] text-[var(--color-text-secondary)]">
              Esta es la bandeja. Aquí aterrizarán tus próximos pasos.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] border-dashed bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[13px] text-[var(--color-text-tertiary)]">
              Pantalla en construcción — siguiente sprint del UX.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
