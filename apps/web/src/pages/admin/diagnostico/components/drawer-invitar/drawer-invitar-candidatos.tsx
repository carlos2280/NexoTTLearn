import { useCandidatosDisponibles } from "@/features/admin-diagnostico/hooks/use-invitar-candidatos"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/shared/ui/patterns/drawer"
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { Search, UserPlus } from "lucide-react"
import { useMemo } from "react"
import type { DrawerInvitarController } from "../../lib/use-drawer-invitar"
import { ChipsSeleccionados } from "./chips-seleccionados"
import { ListaCandidatos } from "./lista-candidatos"
import { ResumenInvitacion } from "./resumen-invitacion"

interface DrawerInvitarCandidatosProps {
  readonly cursoId: string | undefined
  readonly controller: DrawerInvitarController
}

export function DrawerInvitarCandidatos({ cursoId, controller }: DrawerInvitarCandidatosProps) {
  const candidatosQuery = useCandidatosDisponibles({
    cursoId,
    q: controller.busquedaDebounced || undefined,
    limit: 20,
    habilitado: controller.abierto,
  })

  const idsSeleccionados = useMemo(
    () => new Set(controller.seleccionados.map((c) => c.id)),
    [controller.seleccionados],
  )

  const totalSeleccionados = controller.seleccionados.length

  const onClose = (abierto: boolean) => {
    if (!abierto) {
      controller.cerrar()
    }
  }

  const handleEnviar = () => {
    controller.enviar().catch(() => undefined)
  }

  return (
    <Drawer open={controller.abierto} onOpenChange={onClose}>
      <DrawerContent
        title="Invitar candidatos"
        description="Selecciona participantes ya registrados para invitarlos a este curso."
        header={
          <DrawerHeader>
            <div className="flex items-center gap-2 text-text-primary">
              <UserPlus className="size-5" aria-hidden="true" />
              <h2 className="font-semibold text-base">Invitar candidatos</h2>
            </div>
            <p className="mt-1 text-text-muted text-xs">
              Busca participantes existentes y agrégalos al curso. Crear usuarios nuevos llegará en
              un próximo iter.
            </p>
          </DrawerHeader>
        }
        footer={
          <DrawerFooter>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-text-muted text-xs">
                {totalSeleccionados === 0
                  ? "Selecciona al menos un participante"
                  : `${totalSeleccionados} seleccionado${totalSeleccionados === 1 ? "" : "s"}`}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={controller.cerrar}>
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  onClick={handleEnviar}
                  disabled={totalSeleccionados === 0 || controller.enviando}
                  loading={controller.enviando}
                >
                  Enviar invitaciones
                </Button>
              </div>
            </div>
          </DrawerFooter>
        }
      >
        <DrawerBody>
          <Input
            type="search"
            placeholder="Buscar por nombre, apellido o email"
            icon={Search}
            value={controller.busqueda}
            onChange={(e) => controller.setBusqueda(e.target.value)}
            aria-label="Buscar participantes"
          />

          <ChipsSeleccionados
            seleccionados={controller.seleccionados}
            onQuitar={controller.toggle}
          />

          <ListaCandidatos
            items={candidatosQuery.data?.items ?? []}
            idsSeleccionados={idsSeleccionados}
            onToggle={controller.toggle}
            cargando={candidatosQuery.isLoading || candidatosQuery.isFetching}
            truncado={candidatosQuery.data?.truncado ?? false}
            busqueda={controller.busquedaDebounced}
          />

          {controller.resumen ? <ResumenInvitacion resumen={controller.resumen} /> : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
