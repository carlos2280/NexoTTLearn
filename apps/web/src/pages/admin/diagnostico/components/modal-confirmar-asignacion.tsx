import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { Button } from "@/shared/ui/primitives/button"

export interface ResumenConfirmacion {
  readonly candidatos: number
  readonly conAsignacion: number
  readonly sinAsignacion: number
  readonly sinEvaluacion: number
  readonly obligatorios: number
  readonly recomendados: number
  readonly opcionales: number
}

interface Props {
  readonly open: boolean
  readonly resumen: ResumenConfirmacion
  readonly enviando: boolean
  readonly onCancelar: () => void
  readonly onConfirmar: () => void
}

export function ModalConfirmarAsignacion({
  open,
  resumen,
  enviando,
  onCancelar,
  onConfirmar,
}: Props) {
  const total = resumen.obligatorios + resumen.recomendados + resumen.opcionales
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancelar()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Confirmar asignación</DialogTitle>
          <DialogDescription>
            Vas a aplicar las siguientes asignaciones para los candidatos del curso.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <section className="rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-4">
            <h4 className="mb-3 font-semibold text-sm text-text-primary">Resumen cuantitativo</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <Linea label="Candidatos" valor={resumen.candidatos} />
              <Linea label="Con asignación" valor={resumen.conAsignacion} />
              <Linea label="Sin asignación" valor={resumen.sinAsignacion} />
              <Linea label="Sin evaluación" valor={resumen.sinEvaluacion} />
            </ul>
            <hr className="my-3 border-glass-border" />
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <Linea label="OBLIGATORIOS" valor={resumen.obligatorios} />
              <Linea label="RECOMENDADOS" valor={resumen.recomendados} />
              <Linea label="OPCIONALES" valor={resumen.opcionales} />
              <Linea label="Total asignaciones" valor={total} bold={true} />
            </ul>
          </section>
          <section className="rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3 text-sm text-text-secondary">
            <p className="mb-2 font-medium text-text-primary">Esto implica</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Los módulos OBLIGATORIOS no pueden abandonarse por el participante.</li>
              <li>Cada participante recibirá una notificación in-app por cada módulo asignado.</li>
              <li>La asignación se puede modificar después desde Seguimiento.</li>
            </ul>
          </section>
          <p className="text-text-muted text-xs">
            ⚠ Esta acción no se puede revertir en lote. Para deshacer hay que ir a Seguimiento
            candidato a candidato.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} loading={enviando}>
            Aplicar asignaciones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Linea({
  label,
  valor,
  bold,
}: {
  readonly label: string
  readonly valor: number
  readonly bold?: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-text-muted">{label}</span>
      <span
        className={
          bold ? "font-semibold text-text-primary tabular-nums" : "text-text-primary tabular-nums"
        }
      >
        {valor}
      </span>
    </li>
  )
}
