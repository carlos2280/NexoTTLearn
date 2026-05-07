import { useAreasCatalogo } from "@/features/admin-cursos/hooks/use-areas-catalogo"
import { useAgregarCursoArea } from "@/features/admin-cursos/hooks/use-curso-areas"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { type ReactNode, useMemo, useState } from "react"

interface AddAreaDialogProps {
  readonly cursoId: string
  readonly curso: CursoDetalle
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onAdded: (cursoAreaId: string) => void
}

export function AddAreaDialog({ cursoId, curso, open, onOpenChange, onAdded }: AddAreaDialogProps) {
  const catalogo = useAreasCatalogo()
  const agregar = useAgregarCursoArea(cursoId)

  const yaUsadas = useMemo(() => new Set(curso.cursoAreas.map((a) => a.areaId)), [curso.cursoAreas])
  const disponibles = (catalogo.data?.items ?? []).filter((a) => !yaUsadas.has(a.id))
  const sumaActual = curso.cursoAreas.reduce((acc, a) => acc + a.peso, 0)
  const restante = Math.max(0, 100 - sumaActual)

  const [areaId, setAreaId] = useState("")
  const [peso, setPeso] = useState(String(restante))
  const [umbral, setUmbral] = useState("70")

  const handleSubmit = () => {
    const pesoNum = Number.parseFloat(peso)
    const umbralNum = Number.parseInt(umbral, 10)
    const valido = areaId && Number.isFinite(pesoNum) && Number.isFinite(umbralNum)
    if (!valido) {
      return
    }
    agregar.mutate(
      { areaId, peso: pesoNum, puntajeObjetivo: umbralNum },
      {
        onSuccess: (resp) => {
          onAdded(resp.cursoArea.id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader eyebrow="Curso">
          <DialogTitle>Agregar área del catálogo</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Área">
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
            >
              <option value="">— Selecciona —</option>
              {disponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
            {catalogo.isLoading ? (
              <p className="mt-1 text-[11px] text-text-muted">Cargando catálogo…</p>
            ) : null}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Peso (% del curso) · restante ${restante.toFixed(2)}%`}>
              <NumberInput value={peso} onChange={setPeso} min={0} max={100} step={0.01} />
            </Field>
            <Field label="Puntaje objetivo (0–100)">
              <NumberInput value={umbral} onChange={setUmbral} min={0} max={100} step={1} />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!areaId || agregar.isPending}
            loading={agregar.isPending}
          >
            Agregar área
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface FieldProps {
  readonly label: string
  readonly children: ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-text-secondary text-xs">{label}</span>
      {children}
    </div>
  )
}

interface NumberInputProps {
  readonly value: string
  readonly onChange: (v: string) => void
  readonly min: number
  readonly max: number
  readonly step: number
}

function NumberInput({ value, onChange, min, max, step }: NumberInputProps) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
    />
  )
}
