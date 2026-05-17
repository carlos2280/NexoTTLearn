import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { Button } from "@/shared/components/ui/button"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Tabs } from "@/shared/components/ui/tabs"
import { RUTAS } from "@/shared/constants/rutas"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { TabNotificaciones } from "./components/tab-notificaciones"
import { TabPerfil } from "./components/tab-perfil"
import { TabSeguridad } from "./components/tab-seguridad"
import { TabSesiones } from "./components/tab-sesiones"

type TabCuenta = "perfil" | "seguridad" | "sesiones" | "notificaciones"

const TABS: readonly { readonly id: TabCuenta; readonly etiqueta: string }[] = [
  { id: "perfil", etiqueta: "Perfil" },
  { id: "seguridad", etiqueta: "Seguridad" },
  { id: "sesiones", etiqueta: "Sesiones" },
  { id: "notificaciones", etiqueta: "Notificaciones" },
]

export function CuentaPage() {
  const [tab, setTab] = useState<TabCuenta>("perfil")
  const { data: usuario, isLoading } = useUsuarioActual()
  const navigate = useNavigate()

  if (isLoading || !usuario) {
    return (
      <div className="mx-auto flex max-w-[800px] flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Tu cuenta</span>
        <h1 className="text-h1 text-text-primary">{usuario.nombre}</h1>
        <p className="text-body text-text-secondary">{usuario.email}</p>
      </header>

      <Tabs<TabCuenta>
        items={TABS}
        activa={tab}
        onCambiar={setTab}
        etiquetaAria="Secciones de tu cuenta"
      />

      <section role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.etiqueta}>
        {tab === "perfil" ? <TabPerfil usuario={usuario} /> : null}
        {tab === "seguridad" ? <TabSeguridad usuario={usuario} /> : null}
        {tab === "sesiones" ? <TabSesiones /> : null}
        {tab === "notificaciones" ? <TabNotificaciones /> : null}
      </section>

      <hr className="border-border" />

      <footer className="flex items-center justify-between gap-4 pb-2">
        <p className="text-body-sm text-text-tertiary">
          Cuando cierres sesión, tendrás que volver a iniciar sesión en este navegador.
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate(RUTAS.logout)}>
          <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Cerrar sesión
        </Button>
      </footer>
    </div>
  )
}
