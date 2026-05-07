import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { FormField } from "@/shared/ui/patterns/form-field"
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { MOTIVO_MAX, MOTIVO_MIN, NOTA_MAX, NOTA_MIN } from "@nexott-learn/shared-types"
import { useForm } from "react-hook-form"
import { z } from "zod"

const schema = z.object({
  nota: z
    .number({ coerce: true })
    .min(NOTA_MIN, `Mínimo ${NOTA_MIN}`)
    .max(NOTA_MAX, `Máximo ${NOTA_MAX}`),
  motivoAjuste: z
    .string()
    .trim()
    .min(MOTIVO_MIN, `Mínimo ${MOTIVO_MIN} caracteres`)
    .max(MOTIVO_MAX, `Máximo ${MOTIVO_MAX} caracteres`),
})

type FormValues = z.infer<typeof schema>

interface ModalAjustarNotaProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly notaActual: number | null
  readonly nombreParticipante: string
  readonly isPending: boolean
  readonly onConfirmar: (nota: number, motivoAjuste: string) => void
}

export function ModalAjustarNota({
  open,
  onOpenChange,
  notaActual,
  nombreParticipante,
  isPending,
  onConfirmar,
}: ModalAjustarNotaProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nota: notaActual ?? 0, motivoAjuste: "" },
  })

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset()
    }
    onOpenChange(next)
  }

  function onSubmit(values: FormValues) {
    onConfirmar(values.nota, values.motivoAjuste)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <DialogHeader eyebrow="Ajuste manual">
          <DialogTitle>Ajustar nota · {nombreParticipante}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody>
            <FormField label="Nueva nota (0–100)" required={true} error={errors.nota?.message}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={NOTA_MIN}
                  max={NOTA_MAX}
                  step="0.01"
                  {...register("nota", { valueAsNumber: true })}
                />
              )}
            </FormField>
            <FormField
              label="Motivo del ajuste"
              required={true}
              hint={`Mínimo ${MOTIVO_MIN} caracteres. Queda registrado en el log.`}
              error={errors.motivoAjuste?.message}
            >
              {(id) => (
                <textarea
                  id={id}
                  rows={4}
                  className="w-full resize-none rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-brand-violet/60 focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
                  placeholder="Ej: El código tiene un problema de seguridad que la IA no detectó..."
                  {...register("motivoAjuste")}
                />
              )}
            </FormField>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild={true}>
              <Button variant="ghost" size="sm" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button variant="primary" size="sm" type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Confirmar ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
