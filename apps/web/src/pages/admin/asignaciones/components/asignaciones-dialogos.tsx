import {
  useConvertirAAsignado,
  useIniciarProgreso,
  useMarcarListo,
  useReabrirCaso,
  useRetirarAsignacion,
} from "@/features/asignaciones/hooks/use-mutaciones-asignacion"
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import type { Asignacion } from "@nexott-learn/shared-types"
import type { DialogoAbierto } from "../asignaciones.types"
import { DialogoAsignarColaboradores } from "./dialogo-asignar-colaboradores"
import { DialogoCerrarCaso } from "./dialogo-cerrar-caso"
import { DialogoResultadoCliente } from "./dialogo-resultado-cliente"

interface Props {
  readonly cursoId: string
  readonly dialogo: DialogoAbierto | null
  readonly onCerrar: () => void
  readonly tieneEntregaACliente: boolean
}

function nombre(a: Asignacion | undefined): string {
  return a?.colaborador.nombreCompleto ?? ""
}

export function AsignacionesDialogos({ cursoId, dialogo, onCerrar, tieneEntregaACliente }: Props) {
  const convertir = useConvertirAAsignado()
  const iniciar = useIniciarProgreso()
  const marcarListo = useMarcarListo()
  const reabrir = useReabrirCaso()
  const retirar = useRetirarAsignacion()

  const accion = dialogo?.accion
  const a = dialogo?.asignacion

  return (
    <>
      <DialogoAsignarColaboradores
        abierto={accion === "asignar-batch"}
        cursoId={cursoId}
        onCambiarAbierto={(open) => (open ? null : onCerrar())}
        onCompletado={() => onCerrar()}
      />
      <DialogoCerrarCaso
        abierto={accion === "cerrar-caso"}
        asignacion={a}
        onCambiarAbierto={(open) => (open ? null : onCerrar())}
        tieneEntregaACliente={tieneEntregaACliente}
      />
      {tieneEntregaACliente ? (
        <DialogoResultadoCliente
          abierto={accion === "resultado-cliente"}
          asignacion={a}
          onCambiarAbierto={(open) => (open ? null : onCerrar())}
        />
      ) : null}
      <ConfirmMotivoDialog
        abierto={accion === "convertir" && Boolean(a)}
        onCambiarAbierto={(open) => (open ? null : onCerrar())}
        titulo="Convertir voluntario en asignado"
        descripcion={`Colaborador: ${nombre(a)}`}
        textoConfirmar="Convertir"
        enviando={convertir.isPending}
        onConfirmar={async (motivo) => {
          if (a) {
            await convertir.mutateAsync({ asignacionId: a.id, motivo })
            onCerrar()
          }
        }}
      />
      <ConfirmMotivoDialog
        abierto={accion === "reabrir-caso" && Boolean(a)}
        onCambiarAbierto={(open) => (open ? null : onCerrar())}
        titulo="Reabrir caso"
        descripcion={`Colaborador: ${nombre(a)}`}
        textoConfirmar="Reabrir"
        enviando={reabrir.isPending}
        onConfirmar={async (motivo) => {
          if (a) {
            await reabrir.mutateAsync({
              asignacionId: a.id,
              motivo,
              idempotencyKey: crypto.randomUUID(),
            })
            onCerrar()
          }
        }}
      />
      <ConfirmMotivoDialog
        abierto={accion === "retirar" && Boolean(a)}
        onCambiarAbierto={(open) => (open ? null : onCerrar())}
        titulo="Retirar asignación"
        descripcion={`Colaborador: ${nombre(a)}`}
        textoConfirmar="Retirar"
        variante="danger"
        enviando={retirar.isPending}
        onConfirmar={async (motivo) => {
          if (a) {
            await retirar.mutateAsync({ asignacionId: a.id, motivo })
            onCerrar()
          }
        }}
      />
      <ConfirmDialog
        abierto={accion === "iniciar-progreso" && Boolean(a)}
        onCambiarAbierto={(open) => (open ? null : onCerrar())}
        titulo="Iniciar progreso"
        descripcion={`Pasar a EN_PROGRESO a ${nombre(a)}.`}
        textoConfirmar="Iniciar"
        enviando={iniciar.isPending}
        onConfirmar={async () => {
          if (a) {
            await iniciar.mutateAsync(a.id)
            onCerrar()
          }
        }}
      />
      <ConfirmDialog
        abierto={accion === "marcar-listo" && Boolean(a)}
        onCambiarAbierto={(open) => (open ? null : onCerrar())}
        titulo="Marcar listo"
        descripcion={`Marcar como LISTO a ${nombre(a)}. Si hay condiciones pendientes (plan, transversal, IA) el sistema rechazará la operación.`}
        textoConfirmar="Marcar listo"
        enviando={marcarListo.isPending}
        onConfirmar={async () => {
          if (a) {
            await marcarListo.mutateAsync(a.id)
            onCerrar()
          }
        }}
      />
    </>
  )
}
