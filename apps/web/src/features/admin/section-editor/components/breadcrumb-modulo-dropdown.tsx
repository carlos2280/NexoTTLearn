import { RUTAS } from "@/shared/constants/rutas"
import { NxtMenu, NxtMenuItem } from "@carlos2280/nexott-ui/react"
import type { ModuloAdminItem } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"

interface BreadcrumbModuloDropdownProps {
  readonly cursoId: string
  readonly moduloActivo: ModuloAdminItem
  readonly modulos: readonly ModuloAdminItem[]
}

// Item del breadcrumb que abre <NxtMenu> con la lista de modulos del curso.
// Al seleccionar uno, navega a "/secciones/primera" — ese resolver decide la
// primera seccion del modulo destino (o muestra empty state).
export function BreadcrumbModuloDropdown({
  cursoId,
  moduloActivo,
  modulos,
}: BreadcrumbModuloDropdownProps) {
  const navigate = useNavigate()

  const irAModulo = (moduloId: string): void => {
    if (moduloId === moduloActivo.id) {
      return
    }
    navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, "primera"))
  }

  return (
    <NxtMenu placement="bottom-start" trigger="click" closeOnSelect={true} minWidth={260}>
      <button slot="trigger" type="button" className="section-editor__bc-modulo-trigger">
        <span className="section-editor__bc-modulo-num">M{moduloActivo.orden}</span>
        <span className="section-editor__bc-modulo-titulo">{moduloActivo.titulo}</span>
        <span aria-hidden="true" className="section-editor__bc-modulo-caret">
          ▾
        </span>
      </button>
      {modulos.map((m) => (
        <NxtMenuItem
          key={m.id}
          label={`M${m.orden} · ${m.titulo}`}
          onClick={() => irAModulo(m.id)}
        />
      ))}
    </NxtMenu>
  )
}
