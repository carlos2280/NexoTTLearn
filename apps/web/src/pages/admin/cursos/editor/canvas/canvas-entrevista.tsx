import {
  useActualizarEntrevistaIa,
  useEliminarEntrevistaIa,
  useEntrevistaIa,
  useUpsertEntrevistaIa,
} from "@/features/admin-cursos/hooks/use-entrevista-ia"
import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import { Button } from "@/shared/ui/primitives/button"
import type {
  CursoDetalle,
  EntrevistaIADetalleAdmin,
  ModoEntrevistaApi,
} from "@nexott-learn/shared-types"
import { Mic, Trash2, User } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"
import { useEditorStore } from "../use-editor-store"

interface CanvasEntrevistaProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
}

export function CanvasEntrevista({ curso, cursoId }: CanvasEntrevistaProps) {
  const query = useEntrevistaIa(cursoId)
  const setSelected = useEditorStore((s) => s.setSelected)
  const upsert = useUpsertEntrevistaIa(cursoId)

  if (query.isLoading) {
    return (
      <BlockCanvas title="Entrevista IA">
        <p className="text-sm text-text-muted">Cargando…</p>
      </BlockCanvas>
    )
  }

  if (query.data === null || query.data === undefined) {
    return (
      <BlockCanvas
        title={
          <span className="flex items-center gap-2">
            <Mic className="size-5 text-text-muted" strokeWidth={1.5} />
            Entrevista IA
          </span>
        }
        meta={
          <span className="text-text-muted text-xs">
            Inactiva · {curso.pesoEntrevistaIA}% del curso
          </span>
        }
      >
        <div className="rounded-[var(--radius-lg)] border border-glass-border border-dashed bg-glass-1 px-8 py-12 text-center">
          <Mic className="mx-auto mb-3 size-8 text-text-muted" strokeWidth={1.2} />
          <p className="mb-1 font-medium text-sm text-text-primary">Sin entrevista configurada</p>
          <p className="mb-6 text-text-muted text-xs">
            Define el perfil del cliente y el contexto de negocio para activar la entrevista IA.
          </p>
          <Button
            size="sm"
            onClick={() =>
              upsert.mutate(
                {
                  perfilCliente: "Describe el perfil del cliente entrevistador.",
                  contextoNegocio: "Describe el contexto de negocio de la simulación.",
                  umbralAprobacion: 70,
                  numeroPreguntas: 10,
                  modo: "TEXTO",
                  maxIntentos: 3,
                },
                { onSuccess: () => setSelected({ tipo: "entrevista" }) },
              )
            }
            disabled={upsert.isPending}
          >
            Activar entrevista
          </Button>
        </div>
      </BlockCanvas>
    )
  }

  return <CanvasEntrevistaCargada cursoId={cursoId} peso={curso.pesoEntrevistaIA} ei={query.data} />
}

interface CargadaProps {
  readonly cursoId: string
  readonly peso: number
  readonly ei: EntrevistaIADetalleAdmin
}

function CanvasEntrevistaCargada({ cursoId, peso, ei }: CargadaProps) {
  const actualizar = useActualizarEntrevistaIa(cursoId)
  const eliminar = useEliminarEntrevistaIa(cursoId)
  const setSelected = useEditorStore((s) => s.setSelected)

  const [perfil, setPerfil] = useState(ei.perfilCliente)
  const [contexto, setContexto] = useState(ei.contextoNegocio)
  const [preguntas, setPreguntas] = useState(String(ei.numeroPreguntas))
  const [umbral, setUmbral] = useState(String(ei.umbralAprobacion))
  const [intentos, setIntentos] = useState(String(ei.maxIntentos))

  useDebouncedSave(perfil, (v) => {
    const next = v.trim()
    if (next.length > 0 && next !== ei.perfilCliente) {
      actualizar.mutate({ perfilCliente: next })
    }
  })
  useDebouncedSave(contexto, (v) => {
    const next = v.trim()
    if (next.length > 0 && next !== ei.contextoNegocio) {
      actualizar.mutate({ contextoNegocio: next })
    }
  })
  useDebouncedSave(preguntas, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 1 && n <= 50 && n !== ei.numeroPreguntas) {
      actualizar.mutate({ numeroPreguntas: n })
    }
  })
  useDebouncedSave(umbral, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n !== ei.umbralAprobacion) {
      actualizar.mutate({ umbralAprobacion: n })
    }
  })
  useDebouncedSave(intentos, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 1 && n <= 20 && n !== ei.maxIntentos) {
      actualizar.mutate({ maxIntentos: n })
    }
  })

  const [confirmDesactivarOpen, setConfirmDesactivarOpen] = useState(false)
  const handleEliminar = () => setConfirmDesactivarOpen(true)
  const handleConfirmDesactivar = () => {
    eliminar.mutate(undefined, {
      onSuccess: () => {
        setConfirmDesactivarOpen(false)
        setSelected({ tipo: "curso" })
      },
    })
  }

  return (
    <BlockCanvas
      title={
        <span className="flex items-center gap-2">
          <Mic className="size-5 text-brand-violet-soft" strokeWidth={1.5} />
          Entrevista IA
        </span>
      }
      meta={<span className="text-text-muted text-xs">Activa · {peso}% del curso</span>}
    >
      <CanvasField label="Perfil del cliente" icon={<User className="size-3.5 text-text-muted" />}>
        <textarea
          value={perfil}
          onChange={(e) => setPerfil(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary leading-relaxed outline-none focus:border-brand-violet"
        />
      </CanvasField>

      <CanvasField label="Contexto de negocio" icon={<Mic className="size-3.5 text-text-muted" />}>
        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary leading-relaxed outline-none focus:border-brand-violet"
        />
      </CanvasField>

      <div className="grid grid-cols-3 gap-3">
        <NumericField
          label="Nº preguntas"
          min={1}
          max={50}
          value={preguntas}
          onChange={setPreguntas}
        />
        <NumericField
          label="Umbral aprobación (%)"
          min={0}
          max={100}
          value={umbral}
          onChange={setUmbral}
        />
        <NumericField
          label="Máx. intentos"
          min={1}
          max={20}
          value={intentos}
          onChange={setIntentos}
        />
      </div>

      <ModoSelector
        value={ei.modo}
        onChange={(modo) => actualizar.mutate({ modo })}
        disabled={actualizar.isPending}
      />

      <div className="mt-2 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={true} title="Disponible post-MVP">
          <Mic className="size-3.5" />
          Probar entrevista
        </Button>
        <Button variant="ghost" size="sm" onClick={handleEliminar} disabled={eliminar.isPending}>
          <Trash2 className="size-3.5 text-danger" />
          <span className="text-danger">Desactivar entrevista</span>
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDesactivarOpen}
        onOpenChange={setConfirmDesactivarOpen}
        tone="danger"
        title="Desactivar entrevista IA"
        description="Al desactivarla se perderá la configuración actual (perfil, contexto, preguntas y umbrales). Tendrás que volver a definirla si la reactivas."
        confirmLabel="Desactivar entrevista"
        loading={eliminar.isPending}
        onConfirm={handleConfirmDesactivar}
      />
    </BlockCanvas>
  )
}

interface ModoSelectorProps {
  readonly value: ModoEntrevistaApi
  readonly onChange: (modo: ModoEntrevistaApi) => void
  readonly disabled: boolean
}

function ModoSelector({ value, onChange, disabled }: ModoSelectorProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-4">
      <span className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]">
        Modo de entrevista
      </span>
      <div className="flex gap-2">
        {(["TEXTO", "VOZ"] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m)}
            className={`rounded-[var(--radius-sm)] border px-4 py-2 text-sm transition-colors ${
              value === m
                ? "border-brand-violet bg-brand-violet/10 text-brand-violet"
                : "border-glass-border bg-glass-1 text-text-secondary hover:border-brand-violet/40"
            }`}
          >
            {m === "TEXTO" ? "Texto" : "Voz"}
          </button>
        ))}
      </div>
    </div>
  )
}

interface NumericFieldProps {
  readonly label: string
  readonly min: number
  readonly max: number
  readonly value: string
  readonly onChange: (v: string) => void
}

function NumericField({ label, min, max, value, onChange }: NumericFieldProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-4">
      <span className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]">
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-0 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
      />
    </div>
  )
}

interface CanvasFieldProps {
  readonly label: string
  readonly icon: ReactNode
  readonly children: ReactNode
}

function CanvasField({ label, icon, children }: CanvasFieldProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
