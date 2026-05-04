import { RUTAS } from "@/shared/constants/rutas"
import { NxlEditorToolbar } from "@carlos2280/nexott-ui/learn/react"
import { NxtBadge, NxtButton, NxtIcon, NxtText } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { ModuloAdminItem, SeccionAdminItem } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import type { AutoSaveState } from "../hooks/use-auto-save"
import { BreadcrumbModuloDropdown } from "./breadcrumb-modulo-dropdown"

interface SectionEditorShellProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly cursoTitulo: string
  readonly moduloActivo: ModuloAdminItem
  readonly modulosCurso: readonly ModuloAdminItem[]
  readonly seccionActiva: SeccionAdminItem | undefined
  readonly autoSaveState: AutoSaveState
  readonly autoSaveLastSavedAt: number | null
  readonly sidebar: ReactNode
  readonly main: ReactNode
}

// Layout del editor: editor-toolbar (breadcrumb + status + actions) + grid
// sidebar/main. Los slots vienen como children React del shell para que la
// pagina componga su contenido sin duplicar layout.
export function SectionEditorShell({
  cursoId,
  cursoTitulo,
  moduloActivo,
  modulosCurso,
  seccionActiva,
  autoSaveState,
  autoSaveLastSavedAt,
  sidebar,
  main,
}: SectionEditorShellProps) {
  const navigate = useNavigate()

  return (
    <Box slot="content">
      <NxlEditorToolbar
        cursoTitulo={cursoTitulo}
        moduloTitulo={moduloActivo.titulo}
        moduloOrden={moduloActivo.orden}
        seccionTitulo={seccionActiva?.titulo ?? ""}
        cursoHref={RUTAS.admin.cursoEditar(cursoId)}
      >
        {/* Breadcrumb personalizado: el modulo abre dropdown a otros modulos. */}
        <div slot="breadcrumb">
          <Stack direction="row" align="center" gap="xs" wrap={true}>
            <NxtButton
              variant="ghost"
              size="sm"
              onNxtButtonClick={() => navigate(RUTAS.admin.cursos)}
            >
              Cursos
            </NxtButton>
            <NxtIcon name="chevron-right" size="sm" />
            <NxtButton
              variant="ghost"
              size="sm"
              onNxtButtonClick={() => navigate(RUTAS.admin.cursoEditar(cursoId))}
            >
              {cursoTitulo || "Curso"}
            </NxtButton>
            <NxtIcon name="chevron-right" size="sm" />
            <BreadcrumbModuloDropdown
              cursoId={cursoId}
              moduloActivo={moduloActivo}
              modulos={modulosCurso}
            />
            {seccionActiva ? (
              <>
                <NxtIcon name="chevron-right" size="sm" />
                <NxtText size="md" weight="bold">
                  {seccionActiva.titulo}
                </NxtText>
              </>
            ) : null}
          </Stack>
        </div>

        <div slot="status">
          <SaveStatusBadge state={autoSaveState} lastSavedAt={autoSaveLastSavedAt} />
        </div>

        <div slot="actions">
          <Stack direction="row" gap="sm" align="center">
            <NxtButton variant="ghost" size="sm" icon="eye" disabled={true}>
              Vista previa
            </NxtButton>
            <NxtButton variant="primary" size="sm" icon="zap" disabled={true}>
              Publicar
            </NxtButton>
          </Stack>
        </div>
      </NxlEditorToolbar>

      <div className="section-editor__layout">
        <aside className="section-editor__sidebar">{sidebar}</aside>
        <main className="section-editor__main">
          <div className="section-editor__main-inner">{main}</div>
        </main>
      </div>
    </Box>
  )
}

interface SaveStatusBadgeProps {
  readonly state: AutoSaveState
  readonly lastSavedAt: number | null
}

// Indicador "Guardado · hace Xs". Renderiza un NxtBadge variant segun estado.
// El relativo de tiempo lo computamos puntualmente al render — basta para la
// granularidad deseada (no merece useEffect + setInterval).
function SaveStatusBadge({ state, lastSavedAt }: SaveStatusBadgeProps) {
  if (state === "saving") {
    return (
      <NxtBadge variant="info" soft={true}>
        Guardando…
      </NxtBadge>
    )
  }
  if (state === "error") {
    return (
      <NxtBadge variant="danger" soft={true}>
        Error al guardar
      </NxtBadge>
    )
  }
  if (state === "saved" || lastSavedAt) {
    return (
      <NxtBadge variant="success" soft={true}>
        Guardado{lastSavedAt ? ` · ${formatRelativo(lastSavedAt)}` : ""}
      </NxtBadge>
    )
  }
  return null
}

function formatRelativo(ts: number): string {
  const diffMs = Date.now() - ts
  const seconds = Math.max(0, Math.round(diffMs / 1000))
  if (seconds < 5) {
    return "ahora"
  }
  if (seconds < 60) {
    return `hace ${seconds}s`
  }
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `hace ${minutes} min`
  }
  const hours = Math.round(minutes / 60)
  return `hace ${hours} h`
}
