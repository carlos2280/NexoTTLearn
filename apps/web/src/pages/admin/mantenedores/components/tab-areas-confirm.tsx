import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import { describirAreaConfirm, type useAccionesArea } from "../hooks/use-acciones-area"

interface TabAreasConfirmProps {
  readonly acciones: ReturnType<typeof useAccionesArea>
}

export function TabAreasConfirm({ acciones }: TabAreasConfirmProps) {
  if (!acciones.pending) {
    return null
  }
  const confirm = describirAreaConfirm(acciones.pending.kind, acciones.pending.area)
  return (
    <ConfirmDialog
      open={true}
      onOpenChange={(o) => !o && acciones.cancel()}
      tone={confirm.tone}
      title={confirm.title}
      description={confirm.description}
      confirmLabel={confirm.confirmLabel}
      loading={acciones.isPending}
      onConfirm={() => acciones.ejecutar()}
    />
  )
}
