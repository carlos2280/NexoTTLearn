import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { TabNotificaciones } from "@/pages/cuenta/components/tab-notificaciones"
import { TabPerfil } from "@/pages/cuenta/components/tab-perfil"
import { TabPrivacidad } from "@/pages/cuenta/components/tab-privacidad"
import { TabSeguridad } from "@/pages/cuenta/components/tab-seguridad"
import { TabSesiones } from "@/pages/cuenta/components/tab-sesiones"
import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { Button } from "@/shared/components/ui/button"
import { SidePeek } from "@/shared/components/ui/side-peek"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Tabs } from "@/shared/components/ui/tabs"
import { RUTAS } from "@/shared/constants/rutas"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

type TabCuenta = "perfil" | "seguridad" | "sesiones" | "notificaciones" | "privacidad"

const TABS: readonly { readonly id: TabCuenta; readonly etiqueta: string }[] = [
  { id: "perfil", etiqueta: "Perfil" },
  { id: "seguridad", etiqueta: "Seguridad" },
  { id: "sesiones", etiqueta: "Sesiones" },
  { id: "notificaciones", etiqueta: "Notificaciones" },
  { id: "privacidad", etiqueta: "Privacidad" },
]

interface CuentaDrawerProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
}

/**
 * Drawer de "Mi cuenta" — reemplaza la página /cuenta cuando se abre desde
 * el menú del avatar (admin o participante). Mantiene al usuario en su
 * contexto original (cursos, personas, etc.) sin perder la navegación.
 *
 * Reutiliza los tabs existentes de `pages/cuenta` sin duplicar lógica.
 */
export function CuentaDrawer({ abierto, onCambiarAbierto }: CuentaDrawerProps) {
  const [tab, setTab] = useState<TabCuenta>("perfil")
  const { data: usuario, isLoading } = useUsuarioActual()
  const navigate = useNavigate()

  function cerrarSesion(): void {
    onCambiarAbierto(false)
    navigate(RUTAS.logout)
  }

  return (
    <SidePeek
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      ancho="lg"
      titulo={
        isLoading || !usuario ? (
          <Skeleton className="h-6 w-40" />
        ) : (
          <span className="inline-flex items-center gap-3">
            <AvatarIniciales nombre={usuario.nombre} tamano="sm" />
            <span className="truncate">{usuario.nombre}</span>
          </span>
        )
      }
      descripcion={usuario?.email}
    >
      {isLoading || !usuario ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
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
            {tab === "privacidad" ? <TabPrivacidad /> : null}
          </section>

          <hr className="border-border" />

          <footer className="flex items-center justify-between gap-4 pb-2">
            <p className="text-body-sm text-text-tertiary">
              Cuando cierres sesión, tendrás que volver a iniciar sesión en este navegador.
            </p>
            <Button variant="ghost" size="sm" onClick={cerrarSesion}>
              <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Cerrar sesión
            </Button>
          </footer>
        </div>
      )}
    </SidePeek>
  )
}
