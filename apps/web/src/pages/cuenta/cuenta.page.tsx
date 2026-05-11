import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Tabs } from "@/shared/components/ui/tabs"
import { useState } from "react"
import { TabSeguridad } from "./components/tab-seguridad"
import { TabSesiones } from "./components/tab-sesiones"

type TabCuenta = "seguridad" | "sesiones"

const TABS: readonly { readonly id: TabCuenta; readonly etiqueta: string }[] = [
  { id: "seguridad", etiqueta: "Seguridad" },
  { id: "sesiones", etiqueta: "Sesiones" },
]

export function CuentaPage() {
  const [tab, setTab] = useState<TabCuenta>("seguridad")
  const { data: usuario, isLoading } = useUsuarioActual()

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
        {tab === "seguridad" ? <TabSeguridad usuario={usuario} /> : null}
        {tab === "sesiones" ? <TabSesiones /> : null}
      </section>
    </div>
  )
}
