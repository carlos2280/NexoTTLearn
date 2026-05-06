import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtSortableList,
  type NxtSortableReorderDetail,
} from "@carlos2280/nexott-ui/extensions/dnd/react"
import {
  NxlCourseModuleAdmin,
  type NxlCourseModuleIncompleteReason,
} from "@carlos2280/nexott-ui/learn/react"
import type { ModuloAdminItem } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"

interface CursoModulosListProps {
  readonly cursoId: string
  readonly items: readonly ModuloAdminItem[]
  readonly onEditar: (moduloId: string) => void
  readonly onDuplicar: (moduloId: string) => void
  readonly onEliminar: (moduloId: string, titulo: string) => void
  readonly onReordenar: (idsEnNuevoOrden: readonly string[]) => void
}

export function CursoModulosList({
  cursoId,
  items,
  onEditar,
  onDuplicar,
  onEliminar,
  onReordenar,
}: CursoModulosListProps) {
  const navigate = useNavigate()

  // Click en la card -> navega al editor de seccion (flujo principal del admin
  // desde Sprint F4.1). El editor resuelve "primera" -> primera seccion real
  // (o muestra empty state si el modulo esta vacio). El hub clasico
  // (`/secciones`) sigue existiendo para enlace directo, pero ya no se navega
  // desde aqui. La edicion de metadatos del modulo (titulo, slug, peso,
  // area...) queda como accion secundaria dentro del menu ⋯ → Editar.
  const irAEditor = (moduloId: string): void => {
    navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, "primera"))
  }

  return (
    <NxtSortableList
      handle=".drag-handle"
      variant="separated"
      onNxtSortableReorder={(event) => {
        // El wrapper React tipa el detail como `unknown`. Casteamos al
        // contrato del DS (NxtSortableReorderDetail.order: string[]).
        const detail = event.detail as NxtSortableReorderDetail
        onReordenar(detail.order)
      }}
    >
      {items.map((item) => (
        <NxlCourseModuleAdmin
          key={item.id}
          data-sortable-id={item.id}
          moduleId={item.id}
          number={item.orden}
          title={item.titulo}
          description={item.descripcion ?? ""}
          status={item.estado === "PUBLICADO" ? "publicado" : "borrador"}
          sectionsCount={item.sectionsCount}
          contentsCount={item.contentsCount}
          duration={item.duracionEstimada}
          weight={item.peso}
          puntajeObjetivo={item.puntajeObjetivo}
          areaName={item.area?.nombre ?? ""}
          areaColor={item.area?.color ?? "slate"}
          chevron={true}
          incompleteReasons={calcularRazonesIncompleto(item)}
          onNxlCourseModuleClick={(e) => irAEditor(e.detail.moduleId)}
          onNxlCourseModuleEdit={(e) => onEditar(e.detail.moduleId)}
          onNxlCourseModuleDuplicate={(e) => onDuplicar(e.detail.moduleId)}
          onNxlCourseModuleDelete={(e) => onEliminar(e.detail.moduleId, item.titulo)}
        />
      ))}
    </NxtSortableList>
  )
}

// Reglas de "modulo incompleto" del producto. Vivira aqui (no en el DS)
// porque dependen del flujo de NexoTT Learn: para publicar un curso se
// exige al menos 1 seccion con 1 contenido por modulo (ver flujo admin).
// Si el peso del modulo es null, tampoco se puede ponderar la nota.
function calcularRazonesIncompleto(
  item: ModuloAdminItem,
): readonly NxlCourseModuleIncompleteReason[] {
  const razones: NxlCourseModuleIncompleteReason[] = []
  if (item.sectionsCount === 0) {
    razones.push("sin-contenido")
  }
  if (item.peso === null) {
    razones.push("sin-peso")
  }
  return razones
}
