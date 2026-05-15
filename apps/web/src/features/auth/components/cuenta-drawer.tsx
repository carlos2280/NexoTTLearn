import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { TabSeguridad } from "@/pages/cuenta/components/tab-seguridad"
import { TabSesiones } from "@/pages/cuenta/components/tab-sesiones"
import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { SidePeek } from "@/shared/components/ui/side-peek"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Tabs } from "@/shared/components/ui/tabs"
import { useState } from "react"

type TabCuenta = "seguridad" | "sesiones"

const TABS: readonly { readonly id: TabCuenta; readonly etiqueta: string }[] = [
  { id: "seguridad", etiqueta: "Seguridad" },
  { id: "sesiones", etiqueta: "Sesiones" },
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
  const [tab, setTab] = useState<TabCuenta>("seguridad")
  const { data: usuario, isLoading } = useUsuarioActual()

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
            {tab === "seguridad" ? <TabSeguridad usuario={usuario} /> : null}
            {tab === "sesiones" ? <TabSesiones /> : null}
          </section>
        </div>
      )}
    </SidePeek>
  )
}
