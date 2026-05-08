import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import { describirConfirm, type useAccionesUsuario } from "../hooks/use-acciones-usuario"
import { DialogCredenciales } from "./dialog-credenciales"

interface TabUsuariosModalesProps {
  readonly acciones: ReturnType<typeof useAccionesUsuario>
}

export function TabUsuariosModales({ acciones }: TabUsuariosModalesProps) {
  const confirm = acciones.pending
    ? describirConfirm(acciones.pending.kind, acciones.pending.usuario)
    : null

  return (
    <>
      {confirm ? (
        <ConfirmDialog
          open={true}
          onOpenChange={(o) => !o && acciones.cancel()}
          tone={confirm.tone}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          reasonLabel={confirm.reasonLabel}
          loading={acciones.isPending}
          onConfirm={(motivo) => acciones.ejecutar(motivo)}
        />
      ) : null}

      <DialogCredenciales
        open={acciones.credenciales !== undefined}
        onOpenChange={(o) => !o && acciones.cerrarCredenciales()}
        email={acciones.credenciales?.email}
        passwordTemporal={acciones.credenciales?.passwordTemporal}
        title="Credenciales generadas"
        description="Cópialas y compártelas con la persona por canal seguro."
      />
    </>
  )
}
