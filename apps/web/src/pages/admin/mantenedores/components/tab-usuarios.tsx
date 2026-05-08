import { useUsuarios } from "@/features/admin-usuarios/hooks/use-usuarios"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { SearchInput } from "@/shared/ui/patterns/search-input"
import { SegmentedControl, type SegmentedOption } from "@/shared/ui/patterns/segmented-control"
import { Toolbar } from "@/shared/ui/patterns/toolbar"
import { Button } from "@/shared/ui/primitives/button"
import type { UsuarioAdmin } from "@nexott-learn/shared-types"
import { Lock, Plus } from "lucide-react"
import { useState } from "react"
import { useAccionesUsuario } from "../hooks/use-acciones-usuario"
import {
  type FiltroEstado,
  type FiltroRol,
  useFiltrosUsuarios,
} from "../hooks/use-filtros-usuarios"
import { DialogCrearUsuario } from "./dialog-crear-usuario"
import { DialogEditarUsuario } from "./dialog-editar-usuario"
import { TabUsuariosContent } from "./tab-usuarios-content"
import { TabUsuariosModales } from "./tab-usuarios-modales"

const ROL_OPTIONS: readonly SegmentedOption<FiltroRol>[] = [
  { value: "all", label: "Todos" },
  { value: "ADMIN", label: "Admin" },
  { value: "PARTICIPANTE", label: "Participante" },
]
const ESTADO_OPTIONS: readonly SegmentedOption<FiltroEstado>[] = [
  { value: "all", label: "Todos" },
  { value: "ACTIVO", label: "Activos" },
  { value: "BLOQUEADO", label: "Bloqueados" },
]

export function TabUsuarios() {
  const filtros = useFiltrosUsuarios()
  const acciones = useAccionesUsuario()
  const [crearOpen, setCrearOpen] = useState(false)
  const [editarTarget, setEditarTarget] = useState<UsuarioAdmin | undefined>()

  const { data, isLoading, isError, error } = useUsuarios(filtros.query)
  const items = data?.items ?? []
  const total = data?.total ?? 0

  if (error instanceof ApiError && error.status === 403) {
    return (
      <EmptyState
        icon={Lock}
        title="Acceso restringido"
        description="Tu cuenta no tiene permisos para gestionar usuarios."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Toolbar
        search={
          <SearchInput
            value={filtros.busquedaInput}
            onChange={filtros.setBusquedaInput}
            placeholder="Buscar nombre, apellido o email..."
            aria-label="Buscar usuarios"
          />
        }
        filters={
          <>
            <SegmentedControl<FiltroRol>
              value={filtros.rol}
              onChange={filtros.setRol}
              options={ROL_OPTIONS}
              ariaLabel="Filtrar por rol"
              size="sm"
            />
            <SegmentedControl<FiltroEstado>
              value={filtros.estado}
              onChange={filtros.setEstado}
              options={ESTADO_OPTIONS}
              ariaLabel="Filtrar por estado"
              size="sm"
            />
          </>
        }
        trailing={
          <Button onClick={() => setCrearOpen(true)}>
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Nuevo usuario
          </Button>
        }
      />

      <TabUsuariosContent
        items={items}
        isLoading={isLoading}
        isError={isError}
        hasActiveFilters={filtros.hasActiveFilters}
        onEditar={setEditarTarget}
        onResetPassword={(u) => acciones.request("reset-password", u)}
        onActivarMfa={(u) => acciones.request("activar-mfa", u)}
        onResetMfa={(u) => acciones.request("reset-mfa", u)}
        onBloquear={(u) => acciones.request("bloquear", u)}
        onDesbloquear={(u) => acciones.request("desbloquear", u)}
      />

      {!isLoading && items.length > 0 ? (
        <p className="text-text-muted text-xs">
          {filtros.hasActiveFilters
            ? `${items.length} de ${total} resultados`
            : `${total} usuarios`}
        </p>
      ) : null}

      <DialogCrearUsuario
        open={crearOpen}
        onOpenChange={setCrearOpen}
        onCreated={(r) =>
          acciones.mostrarCredenciales({
            email: r.usuario.email,
            passwordTemporal: r.passwordTemporal,
          })
        }
      />

      <DialogEditarUsuario
        open={editarTarget !== undefined}
        onOpenChange={(o) => !o && setEditarTarget(undefined)}
        usuario={editarTarget}
        onUpdated={() => setEditarTarget(undefined)}
      />

      <TabUsuariosModales acciones={acciones} />
    </div>
  )
}
