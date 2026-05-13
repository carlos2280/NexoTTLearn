import { Tabs } from "@/shared/components/ui/tabs"
import { Building2, FolderTree, Library, Sparkles } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { ETIQUETA_TAB, TABS_CATALOGO, type TabCatalogo } from "./catalogo.types"
import { TabAreas } from "./tabs/tab-areas"
import { TabClientes } from "./tabs/tab-clientes"
import { TabModulos } from "./tabs/tab-modulos"
import { TabSkills } from "./tabs/tab-skills"

const ICONO_TAB: Record<TabCatalogo, typeof FolderTree> = {
  areas: FolderTree,
  skills: Sparkles,
  modulos: Library,
  clientes: Building2,
}

const TAB_DEFECTO: TabCatalogo = "areas"

function parsearTab(valor: string | null): TabCatalogo {
  return TABS_CATALOGO.includes(valor as TabCatalogo) ? (valor as TabCatalogo) : TAB_DEFECTO
}

export function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activa = parsearTab(searchParams.get("tab"))

  const cambiarTab = (siguiente: TabCatalogo) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("tab", siguiente)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Catálogo formativo</span>
        <h1 className="text-h1 text-text-primary">Catálogo</h1>
        <p className="max-w-2xl text-body text-text-secondary">
          La cantera del aprendizaje: áreas, skills, módulos y clientes. Todo lo que el resto de la
          plataforma usa para armar cursos.
        </p>
      </header>
      <Tabs<TabCatalogo>
        items={TABS_CATALOGO.map((id) => {
          const Icono = ICONO_TAB[id]
          return {
            id,
            etiqueta: (
              <span className="inline-flex items-center gap-2">
                <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
                {ETIQUETA_TAB[id]}
              </span>
            ),
          }
        })}
        activa={activa}
        onCambiar={cambiarTab}
        etiquetaAria="Recurso del catálogo"
      />
      <section role="tabpanel" aria-label={ETIQUETA_TAB[activa]}>
        {activa === "areas" ? <TabAreas /> : null}
        {activa === "skills" ? <TabSkills /> : null}
        {activa === "modulos" ? <TabModulos /> : null}
        {activa === "clientes" ? <TabClientes /> : null}
      </section>
    </div>
  )
}
