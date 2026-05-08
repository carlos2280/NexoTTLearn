import { useActualizarCurso } from "@/features/admin-cursos/hooks/use-actualizar-curso"
import { useActualizarCursoArea } from "@/features/admin-cursos/hooks/use-curso-areas"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { Check, Loader2, X } from "lucide-react"
import type { MouseEvent } from "react"
import { useEffect, useMemo, useState } from "react"

const TOLERANCIA = 0.01

// ─── Tipos ─────────────────────────────────────────────────────────

interface UsePesosArgs {
  readonly cursoId: string
  readonly curso: CursoDetalle
}

/**
 * Estado coordinado para edición inline de pesos en el árbol del editor.
 *
 * Maneja DOS niveles independientes pero presentados juntos:
 *  - Áreas: cada cursoArea.peso (suma 100 entre áreas)
 *  - Curso: pesoAreas + pesoProyectoTransversal + pesoEntrevistaIA (suma 100)
 *
 * Ambos validan por separado y se persisten con PATCHs distintos al guardar.
 */
export interface PesosState {
  // Áreas
  readonly draftsAreas: ReadonlyMap<string, number>
  readonly setPesoArea: (cursoAreaId: string, valor: number) => void
  readonly resetPesoArea: (cursoAreaId: string) => void
  // Nivel curso
  readonly draftAreas: number | null
  readonly draftTransversal: number | null
  readonly draftEntrevista: number | null
  readonly setPesoNivelAreas: (valor: number) => void
  readonly setPesoTransversal: (valor: number) => void
  readonly setPesoEntrevista: (valor: number) => void
  // Comunes
  readonly resetAll: () => void
  readonly guardar: () => void
  readonly isPending: boolean
  readonly errorMsg: string | null
  readonly successAt: number | null

  // Cómputos derivados (lectura)
  readonly sumaAreas: number
  readonly sumaAreasOk: boolean
  readonly hayCambiosAreas: boolean
  readonly hayFueraRangoAreas: boolean
  readonly sumaCurso: number
  readonly sumaCursoOk: boolean
  readonly hayCambiosCurso: boolean
  readonly hayFueraRangoCurso: boolean
  readonly puedeGuardar: boolean
  readonly hayCambios: boolean
  readonly pesoAreasVigente: number
  readonly pesoTransversalVigente: number
  readonly pesoEntrevistaVigente: number
}

// ─── Hook ──────────────────────────────────────────────────────────

export function usePesos({ cursoId, curso }: UsePesosArgs): PesosState {
  const actualizarArea = useActualizarCursoArea(cursoId)
  const actualizarCurso = useActualizarCurso(cursoId)

  const [draftsAreas, setDraftsAreas] = useState<Map<string, number>>(new Map())
  const [draftAreas, setDraftAreas] = useState<number | null>(null)
  const [draftTransversal, setDraftTransversal] = useState<number | null>(null)
  const [draftEntrevista, setDraftEntrevista] = useState<number | null>(null)
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
    setDraftsAreas(new Map())
    setDraftAreas(null)
    setDraftTransversal(null)
    setDraftEntrevista(null)
    setErrorMsg(null)
    setSuccessAt(null)
  }, [curso.id])

  // ── Áreas ────────────────────────────────────────────────────────
  const persistidosAreas = useMemo(
    () => new Map(curso.cursoAreas.map((a) => [a.id, a.peso])),
    [curso.cursoAreas],
  )

  const valorVigenteArea = (cursoAreaId: string): number => {
    const draft = draftsAreas.get(cursoAreaId)
    return draft !== undefined ? draft : (persistidosAreas.get(cursoAreaId) ?? 0)
  }

  const setPesoArea = (cursoAreaId: string, valor: number) => {
    setDraftsAreas((prev) => {
      const next = new Map(prev)
      const persistido = persistidosAreas.get(cursoAreaId) ?? 0
      if (Math.abs(valor - persistido) < TOLERANCIA) {
        next.delete(cursoAreaId)
      } else {
        next.set(cursoAreaId, valor)
      }
      return next
    })
    setErrorMsg(null)
  }

  const resetPesoArea = (cursoAreaId: string) => {
    setDraftsAreas((prev) => {
      if (!prev.has(cursoAreaId)) {
        return prev
      }
      const next = new Map(prev)
      next.delete(cursoAreaId)
      return next
    })
  }

  // ── Nivel curso ──────────────────────────────────────────────────
  const setDraftConLimpieza = (
    valor: number,
    persistido: number,
    setter: (v: number | null) => void,
  ) => {
    if (Math.abs(valor - persistido) < TOLERANCIA) {
      setter(null)
    } else {
      setter(valor)
    }
    setErrorMsg(null)
  }

  const setPesoNivelAreas = (v: number) => setDraftConLimpieza(v, curso.pesoAreas, setDraftAreas)
  const setPesoTransversal = (v: number) =>
    setDraftConLimpieza(v, curso.pesoProyectoTransversal, setDraftTransversal)
  const setPesoEntrevista = (v: number) =>
    setDraftConLimpieza(v, curso.pesoEntrevistaIA, setDraftEntrevista)

  // ── Cómputos ─────────────────────────────────────────────────────
  const sumaAreas = curso.cursoAreas.reduce((acc, a) => acc + valorVigenteArea(a.id), 0)
  const sumaAreasOk = Math.abs(sumaAreas - 100) < TOLERANCIA
  const hayCambiosAreas = draftsAreas.size > 0
  const hayFueraRangoAreas = curso.cursoAreas.some((a) => {
    const v = valorVigenteArea(a.id)
    return v < 0 || v > 100
  })

  const pesoAreasVigente = draftAreas !== null ? draftAreas : curso.pesoAreas
  const pesoTransversalVigente =
    draftTransversal !== null ? draftTransversal : curso.pesoProyectoTransversal
  const pesoEntrevistaVigente = draftEntrevista !== null ? draftEntrevista : curso.pesoEntrevistaIA
  const sumaCurso = pesoAreasVigente + pesoTransversalVigente + pesoEntrevistaVigente
  const sumaCursoOk = Math.abs(sumaCurso - 100) < TOLERANCIA
  const hayCambiosCurso =
    draftAreas !== null || draftTransversal !== null || draftEntrevista !== null
  const fueraRango = (n: number) => n < 0 || n > 100
  const hayFueraRangoCurso =
    fueraRango(pesoAreasVigente) ||
    fueraRango(pesoTransversalVigente) ||
    fueraRango(pesoEntrevistaVigente)

  const hayCambios = hayCambiosAreas || hayCambiosCurso

  // Sólo se puede guardar si los grupos con cambios validan su propia suma=100.
  const areasValidan = !hayCambiosAreas || (sumaAreasOk && !hayFueraRangoAreas)
  const cursoValidan = !hayCambiosCurso || (sumaCursoOk && !hayFueraRangoCurso)
  const isPending = actualizarArea.isPending || actualizarCurso.isPending
  const puedeGuardar = hayCambios && areasValidan && cursoValidan && !isPending

  // ── Guardar ──────────────────────────────────────────────────────
  const guardar = () => {
    if (!puedeGuardar) {
      return
    }
    setErrorMsg(null)
    const tareas: Promise<unknown>[] = []

    for (const [cursoAreaId, peso] of draftsAreas.entries()) {
      tareas.push(actualizarArea.mutateAsync({ cursoAreaId, input: { peso } }))
    }

    if (hayCambiosCurso) {
      tareas.push(
        actualizarCurso.mutateAsync({
          pesoAreas: pesoAreasVigente,
          pesoProyectoTransversal: pesoTransversalVigente,
          pesoEntrevistaIA: pesoEntrevistaVigente,
        }),
      )
    }

    Promise.all(tareas)
      .then(() => {
        setDraftsAreas(new Map())
        setDraftAreas(null)
        setDraftTransversal(null)
        setDraftEntrevista(null)
        setSuccessAt(Date.now())
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "No se pudieron guardar los pesos"
        setErrorMsg(msg)
      })
  }

  const resetAll = () => {
    setDraftsAreas(new Map())
    setDraftAreas(null)
    setDraftTransversal(null)
    setDraftEntrevista(null)
    setErrorMsg(null)
  }

  return {
    draftsAreas,
    setPesoArea,
    resetPesoArea,
    draftAreas,
    draftTransversal,
    draftEntrevista,
    setPesoNivelAreas,
    setPesoTransversal,
    setPesoEntrevista,
    resetAll,
    guardar,
    isPending,
    errorMsg,
    successAt,
    sumaAreas,
    sumaAreasOk,
    hayCambiosAreas,
    hayFueraRangoAreas,
    sumaCurso,
    sumaCursoOk,
    hayCambiosCurso,
    hayFueraRangoCurso,
    puedeGuardar,
    hayCambios,
    pesoAreasVigente,
    pesoTransversalVigente,
    pesoEntrevistaVigente,
  }
}

// ─── Input inline genérico ─────────────────────────────────────────

interface PesoInlineInputProps {
  readonly persistido: number
  readonly draft: number | null | undefined
  readonly onChange: (valor: number) => void
  readonly onReset?: () => void
  readonly title?: string
}

/**
 * Display + editor inline genérico para un peso porcentual.
 * Click → input numérico. Enter confirma, Esc cancela. Doble click descarta draft.
 */
export function PesoInlineInput({
  persistido,
  draft,
  onChange,
  onReset,
  title = "Editar peso",
}: PesoInlineInputProps) {
  const modificado = draft !== null && draft !== undefined
  const vigente = modificado ? (draft as number) : persistido
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
      onChange(num)
    }
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
            setEditando(false)
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
        if (modificado && onReset) {
          onReset()
        }
      }}
      title={modificado ? "Doble click para descartar este cambio" : title}
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

// ─── Wrappers específicos por contexto ─────────────────────────────

interface AreaProps {
  readonly cursoAreaId: string
  readonly persistido: number
  readonly state: PesosState
}

export function PesoAreaInline({ cursoAreaId, persistido, state }: AreaProps) {
  const draft = state.draftsAreas.get(cursoAreaId)
  return (
    <PesoInlineInput
      persistido={persistido}
      draft={draft}
      onChange={(v) => state.setPesoArea(cursoAreaId, v)}
      onReset={() => state.resetPesoArea(cursoAreaId)}
    />
  )
}

interface NivelCursoProps {
  readonly state: PesosState
  readonly persistido: number
}

export function PesoTransversalInline({ state, persistido }: NivelCursoProps) {
  return (
    <PesoInlineInput
      persistido={persistido}
      draft={state.draftTransversal}
      onChange={state.setPesoTransversal}
      onReset={() => state.setPesoTransversal(persistido)}
      title="Editar peso del Proyecto Transversal"
    />
  )
}

export function PesoEntrevistaInline({ state, persistido }: NivelCursoProps) {
  return (
    <PesoInlineInput
      persistido={persistido}
      draft={state.draftEntrevista}
      onChange={state.setPesoEntrevista}
      onReset={() => state.setPesoEntrevista(persistido)}
      title="Editar peso de la Entrevista IA"
    />
  )
}

// ─── Footer global ─────────────────────────────────────────────────

interface PesosFooterProps {
  readonly state: PesosState
}

/** Footer único al fondo del árbol con suma global del curso + Guardar. */
export function PesosFooter({ state }: PesosFooterProps) {
  if (!state.hayCambios && state.successAt === null && !state.errorMsg) {
    return null
  }

  return (
    <div className="my-2 flex flex-col gap-2 rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2.5">
      <SumaAreasRow state={state} />
      <SumaCursoBlock state={state} />
      <FooterActions state={state} />
      <FooterFeedback state={state} />
    </div>
  )
}

function SumaAreasRow({ state }: { readonly state: PesosState }) {
  if (!state.hayCambiosAreas) {
    return null
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-text-muted">Suma áreas</span>
      <span
        className={`text-[11px] tabular-nums ${state.sumaAreasOk ? "text-success" : "text-warning"}`}
      >
        {state.sumaAreas.toFixed(2)}% {state.sumaAreasOk ? "✓" : "(debe ser 100)"}
      </span>
    </div>
  )
}

function SumaCursoBlock({ state }: { readonly state: PesosState }) {
  if (!state.hayCambiosCurso) {
    return null
  }
  const sugerenciaAreas = 100 - state.pesoTransversalVigente - state.pesoEntrevistaVigente
  const sugerenciaValida = sugerenciaAreas >= 0 && sugerenciaAreas <= 100
  const necesitaAjusteAreas = !state.sumaCursoOk && sugerenciaValida

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-muted">Total curso</span>
        <span
          className={`text-[11px] tabular-nums ${state.sumaCursoOk ? "text-success" : "text-warning"}`}
        >
          {state.sumaCurso.toFixed(2)}% {state.sumaCursoOk ? "✓" : "(debe ser 100)"}
        </span>
      </div>
      <p className="text-[10px] text-text-faint leading-tight">
        {`Áreas ${state.pesoAreasVigente}% + Transversal ${state.pesoTransversalVigente}% + Entrevista ${state.pesoEntrevistaVigente}%`}
      </p>
      {necesitaAjusteAreas ? (
        <button
          type="button"
          onClick={() => state.setPesoNivelAreas(sugerenciaAreas)}
          className="self-start rounded-[var(--radius-xs)] border border-brand-violet/40 bg-brand-violet/10 px-2 py-1 text-[10px] text-brand-violet-soft transition-colors hover:bg-brand-violet/20"
        >
          Ajustar Áreas a {sugerenciaAreas.toFixed(0)}% para sumar 100
        </button>
      ) : null}
    </>
  )
}

function FooterActions({ state }: { readonly state: PesosState }) {
  if (!state.hayCambios) {
    return null
  }
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="primary"
        onClick={state.guardar}
        disabled={!state.puedeGuardar}
        loading={state.isPending}
      >
        Guardar pesos
      </Button>
      <Button size="sm" variant="ghost" onClick={state.resetAll} disabled={state.isPending}>
        Descartar
      </Button>
    </div>
  )
}

function FooterFeedback({ state }: { readonly state: PesosState }) {
  if (state.isPending) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-text-muted">
        <Loader2 className="size-3 animate-spin" />
        Guardando…
      </p>
    )
  }
  if (state.errorMsg) {
    return (
      <p className="flex items-start gap-1 text-[11px] text-warning">
        <X className="mt-0.5 size-3 shrink-0" />
        <span>{state.errorMsg}</span>
      </p>
    )
  }
  if (state.successAt !== null && !state.hayCambios) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-success">
        <Check className="size-3" />
        Guardado a las {new Date(state.successAt).toLocaleTimeString("es-CL")}
      </p>
    )
  }
  return null
}
