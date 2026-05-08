import { useActualizarCursoArea } from "@/features/admin-cursos/hooks/use-curso-areas"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { Check, Loader2, X } from "lucide-react"
import type { MouseEvent } from "react"
import { useEffect, useMemo, useState } from "react"

const TOLERANCIA = 0.01

interface UsePesosAreasArgs {
  readonly cursoId: string
  readonly curso: CursoDetalle
}

interface PesosAreasState {
  readonly drafts: ReadonlyMap<string, number>
  readonly setPeso: (cursoAreaId: string, valor: number) => void
  readonly resetPeso: (cursoAreaId: string) => void
  readonly resetAll: () => void
  readonly guardar: () => void
  readonly suma: number
  readonly sumaOk: boolean
  readonly hayCambios: boolean
  readonly hayFueraRango: boolean
  readonly puedeGuardar: boolean
  readonly isPending: boolean
  readonly errorMsg: string | null
  readonly successAt: number | null
}

/**
 * Estado coordinado para edición inline de pesos de áreas en el árbol del editor.
 * Reglas:
 * - Drafts en memoria; sólo se persiste con `guardar()`.
 * - `guardar()` valida suma=100, rango [0,100] y dispara PATCH paralelo por
 *   cada área modificada. Indicador de éxito visible 4s.
 * - Reset por área (al cancelar input) o global (botón Descartar).
 */
export function usePesosAreas({ cursoId, curso }: UsePesosAreasArgs): PesosAreasState {
  const actualizar = useActualizarCursoArea(cursoId)
  const [drafts, setDrafts] = useState<Map<string, number>>(new Map())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successAt, setSuccessAt] = useState<number | null>(null)

  // Auto-oculta el indicador de éxito a los 4s.
  useEffect(() => {
    if (successAt === null) {
      return
    }
    const t = setTimeout(() => setSuccessAt(null), 4000)
    return () => clearTimeout(t)
  }, [successAt])

  // Resetea drafts si cambia el curso (navegación entre cursos).
  // biome-ignore lint/correctness/useExhaustiveDependencies: queremos reaccionar sólo al id del curso.
  useEffect(() => {
    setDrafts(new Map())
    setErrorMsg(null)
    setSuccessAt(null)
  }, [curso.id])

  // Mapa rápido id→peso persistido.
  const persistidos = useMemo(
    () => new Map(curso.cursoAreas.map((a) => [a.id, a.peso])),
    [curso.cursoAreas],
  )

  const valorVigente = (cursoAreaId: string): number => {
    const draft = drafts.get(cursoAreaId)
    return draft !== undefined ? draft : (persistidos.get(cursoAreaId) ?? 0)
  }

  const setPeso = (cursoAreaId: string, valor: number) => {
    setDrafts((prev) => {
      const next = new Map(prev)
      const persistido = persistidos.get(cursoAreaId) ?? 0
      // Si el draft vuelve al valor persistido, lo borramos para limpiar.
      if (Math.abs(valor - persistido) < TOLERANCIA) {
        next.delete(cursoAreaId)
      } else {
        next.set(cursoAreaId, valor)
      }
      return next
    })
    setErrorMsg(null)
  }

  const resetPeso = (cursoAreaId: string) => {
    setDrafts((prev) => {
      if (!prev.has(cursoAreaId)) {
        return prev
      }
      const next = new Map(prev)
      next.delete(cursoAreaId)
      return next
    })
  }

  const resetAll = () => {
    setDrafts(new Map())
    setErrorMsg(null)
  }

  const suma = curso.cursoAreas.reduce((acc, a) => acc + valorVigente(a.id), 0)
  const sumaOk = Math.abs(suma - 100) < TOLERANCIA
  const hayCambios = drafts.size > 0
  const hayFueraRango = curso.cursoAreas.some((a) => {
    const v = valorVigente(a.id)
    return v < 0 || v > 100
  })
  const puedeGuardar = hayCambios && sumaOk && !hayFueraRango && !actualizar.isPending

  const guardar = () => {
    if (!puedeGuardar) {
      return
    }
    setErrorMsg(null)
    const cambiadas = Array.from(drafts.entries())
    Promise.all(
      cambiadas.map(([cursoAreaId, peso]) =>
        actualizar.mutateAsync({ cursoAreaId, input: { peso } }),
      ),
    )
      .then(() => {
        setDrafts(new Map())
        setSuccessAt(Date.now())
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "No se pudieron guardar los pesos"
        setErrorMsg(msg)
      })
  }

  return {
    drafts,
    setPeso,
    resetPeso,
    resetAll,
    guardar,
    suma,
    sumaOk,
    hayCambios,
    hayFueraRango,
    puedeGuardar,
    isPending: actualizar.isPending,
    errorMsg,
    successAt,
  }
}

// ─── UI ────────────────────────────────────────────────────────────

interface PesoInlineInputProps {
  readonly cursoAreaId: string
  readonly persistido: number
  readonly drafts: ReadonlyMap<string, number>
  readonly onChange: (cursoAreaId: string, valor: number) => void
  readonly onReset: (cursoAreaId: string) => void
}

/** Display + editor inline para el peso de un área. Click → input numérico. */
export function PesoInlineInput({
  cursoAreaId,
  persistido,
  drafts,
  onChange,
  onReset,
}: PesoInlineInputProps) {
  const draft = drafts.get(cursoAreaId)
  const vigente = draft !== undefined ? draft : persistido
  const modificado = draft !== undefined
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(String(vigente))

  const empezar = (e: MouseEvent) => {
    e.stopPropagation()
    setBorrador(String(vigente))
    setEditando(true)
  }

  const confirmar = () => {
    const num = Number.parseFloat(borrador)
    if (Number.isFinite(num) && num >= 0 && num <= 100) {
      onChange(cursoAreaId, num)
    }
    setEditando(false)
  }

  const cancelar = () => {
    setEditando(false)
  }

  if (editando) {
    return (
      <input
        type="number"
        min={0}
        max={100}
        step={0.01}
        value={borrador}
        autoComplete="off"
        ref={(el) => el?.select()}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            confirmar()
          } else if (e.key === "Escape") {
            e.preventDefault()
            cancelar()
          }
        }}
        className="w-14 rounded-[var(--radius-xs)] border border-brand-violet/60 bg-glass-1 px-1.5 py-0.5 text-right text-[11px] text-text-primary outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={empezar}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (modificado) {
          onReset(cursoAreaId)
        }
      }}
      title={modificado ? "Doble click para descartar este cambio" : "Editar peso"}
      className={`inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-0.5 font-medium text-[11px] transition-colors ${
        modificado
          ? "border border-brand-violet/40 bg-brand-violet/10 text-brand-violet-soft"
          : "border border-transparent text-text-muted hover:border-glass-border hover:bg-glass-2 hover:text-text-primary"
      }`}
    >
      {modificado ? (
        <span className="size-1 rounded-full bg-brand-violet" aria-hidden="true" />
      ) : null}
      {`${vigente}%`}
    </button>
  )
}

interface PesosAreasFooterProps {
  readonly state: PesosAreasState
}

/** Banda de validación + Guardar, anclada bajo el grupo de áreas en el árbol. */
export function PesosAreasFooter({ state }: PesosAreasFooterProps) {
  const { suma, sumaOk, hayCambios, isPending, errorMsg, successAt } = state

  // Banda discreta cuando no hay cambios (sólo muestra suma OK).
  if (!hayCambios && successAt === null && !errorMsg) {
    return null
  }

  return (
    <div className="my-1 flex flex-col gap-1.5 rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] tabular-nums ${sumaOk ? "text-success" : "text-warning"}`}>
          Suma: {suma.toFixed(2)}% {sumaOk ? "✓" : "(debe ser 100)"}
        </span>
        {isPending ? (
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <Loader2 className="size-3 animate-spin" />
            Guardando…
          </span>
        ) : null}
      </div>

      {hayCambios ? (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="primary"
            onClick={state.guardar}
            disabled={!state.puedeGuardar}
            loading={isPending}
          >
            Guardar pesos
          </Button>
          <Button size="sm" variant="ghost" onClick={state.resetAll} disabled={isPending}>
            Descartar
          </Button>
        </div>
      ) : null}

      {errorMsg ? (
        <p className="flex items-start gap-1 text-[11px] text-warning">
          <X className="mt-0.5 size-3 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      ) : null}

      {successAt !== null && !hayCambios && !errorMsg ? (
        <p className="flex items-center gap-1 text-[11px] text-success">
          <Check className="size-3" />
          Guardado a las {new Date(successAt).toLocaleTimeString("es-CL")}
        </p>
      ) : null}
    </div>
  )
}
