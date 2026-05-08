import { useActualizarCurso } from "@/features/admin-cursos/hooks/use-actualizar-curso"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import type { ActualizarCursoInput, CursoDetalle } from "@nexott-learn/shared-types"
import { Sparkles } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"

interface InspectorCursoProps {
  readonly curso: CursoDetalle
  readonly onPublish: () => void
}

export function InspectorCurso({ curso, onPublish }: InspectorCursoProps) {
  const actualizar = useActualizarCurso(curso.id)
  const save = (input: ActualizarCursoInput) => actualizar.mutate(input)

  return (
    <InspectorPanel
      eyebrow="Curso"
      title={curso.titulo}
      subtitle={
        <span>
          Para <span className="text-text-primary">{curso.empresaCliente}</span>
        </span>
      }
    >
      <IdentidadSection curso={curso} save={save} />
      <DescripcionSection curso={curso} save={save} />
      <FechasSection curso={curso} save={save} />
      <InscripcionSection curso={curso} save={save} />
      <PesosIntraModuloSection curso={curso} save={save} />
      <UmbralesSection curso={curso} save={save} />
      <AvanzadoSection curso={curso} />

      {curso.estado === "BORRADOR" ? (
        <div className="-mx-1 mt-2 rounded-[var(--radius-md)] bg-[var(--gradient-brand-soft)] p-3">
          <p className="mb-2 flex items-center gap-1.5 font-medium text-text-primary text-xs">
            <Sparkles className="size-3.5 text-brand-violet-soft" strokeWidth={1.8} />
            Listo cuando completes el checklist
          </p>
          <Button size="sm" full={true} onClick={onPublish}>
            Publicar curso
          </Button>
        </div>
      ) : null}
    </InspectorPanel>
  )
}

// ─── Identidad ─────────────────────────────────────────────────────

interface SectionProps {
  readonly curso: CursoDetalle
  readonly save: (input: ActualizarCursoInput) => void
}

function IdentidadSection({ curso, save }: SectionProps) {
  const [empresaCliente, setEmpresaCliente] = useState(curso.empresaCliente)
  const [titulo, setTitulo] = useState(curso.titulo)
  const [slug, setSlug] = useState(curso.slug)

  useDebouncedSave(empresaCliente, (v) => {
    const next = v.trim()
    if (next.length >= 2 && next !== curso.empresaCliente) {
      save({ empresaCliente: next })
    }
  })
  useDebouncedSave(titulo, (v) => {
    const next = v.trim()
    if (next.length >= 3 && next !== curso.titulo) {
      save({ titulo: next })
    }
  })
  useDebouncedSave(slug, (v) => {
    const next = v.trim()
    if (next.length >= 3 && next !== curso.slug) {
      save({ slug: next })
    }
  })

  return (
    <InspectorSection title="Identidad">
      <InspectorRow label="Empresa cliente">
        <Input
          value={empresaCliente}
          onChange={(e) => setEmpresaCliente(e.target.value)}
          placeholder="Empresa cliente"
        />
      </InspectorRow>
      <InspectorRow label="Título del curso">
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Fullstack Developer"
        />
      </InspectorRow>
      <InspectorRow
        label="Slug"
        hint="URL pública. Edítalo solo si necesitas un identificador específico."
      >
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
      </InspectorRow>
    </InspectorSection>
  )
}

// ─── Descripción ───────────────────────────────────────────────────

function DescripcionSection({ curso, save }: SectionProps) {
  const [descripcion, setDescripcion] = useState(curso.descripcion ?? "")

  useDebouncedSave(descripcion, (v) => {
    const next = v.trim()
    const actual = curso.descripcion ?? ""
    if (next === actual) {
      return
    }
    save({ descripcion: next.length === 0 ? null : next })
  })

  return (
    <InspectorSection title="Descripción" defaultOpen={false}>
      <InspectorRow
        label="Descripción corta"
        hint="Texto que se ve en la card del curso. Máximo 500 caracteres."
      >
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Describe brevemente el objetivo del curso…"
          className="w-full resize-none rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary leading-relaxed outline-none focus:border-brand-violet"
        />
      </InspectorRow>
    </InspectorSection>
  )
}

// ─── Fechas ────────────────────────────────────────────────────────

function FechasSection({ curso, save }: SectionProps) {
  const [fechaInicio, setFechaInicio] = useState(toInputDate(curso.fechaInicio))
  const [deadline, setDeadline] = useState(toInputDate(curso.deadline))

  useDebouncedSave(fechaInicio, (v) => {
    const next = v ? new Date(v).toISOString() : null
    if (next !== curso.fechaInicio) {
      save({ fechaInicio: next })
    }
  })
  useDebouncedSave(deadline, (v) => {
    const next = v ? new Date(v).toISOString() : null
    if (next !== curso.deadline) {
      save({ deadline: next })
    }
  })

  const duracion = computeDuracion(fechaInicio, deadline)

  return (
    <InspectorSection title="Fechas">
      <InspectorRow label="Inicio">
        <DateInput value={fechaInicio} onChange={setFechaInicio} />
      </InspectorRow>
      <InspectorRow label="Deadline">
        <DateInput value={deadline} onChange={setDeadline} />
      </InspectorRow>
      {duracion ? (
        <p className="text-[11px] text-text-muted">Duración estimada: {duracion}</p>
      ) : null}
    </InspectorSection>
  )
}

// ─── Inscripción ───────────────────────────────────────────────────

function InscripcionSection({ curso, save }: SectionProps) {
  const handleChange = (libre: boolean) => {
    if (libre !== curso.permiteInscripcionLibre) {
      save({ permiteInscripcionLibre: libre })
    }
  }

  return (
    <InspectorSection title="Inscripción" defaultOpen={false}>
      <RadioOption
        checked={!curso.permiteInscripcionLibre}
        onSelect={() => handleChange(false)}
        label="Sólo por solicitud"
        description="El admin invita candidatos. No aparece en el catálogo público."
      />
      <RadioOption
        checked={curso.permiteInscripcionLibre}
        onSelect={() => handleChange(true)}
        label="Permitir inscripción libre"
        description="Aparece en el catálogo público. Todos los módulos quedan opcionales."
      />
    </InspectorSection>
  )
}

interface RadioOptionProps {
  readonly checked: boolean
  readonly onSelect: () => void
  readonly label: string
  readonly description: string
}

function RadioOption({ checked, onSelect, label, description }: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col gap-1 rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors ${
        checked
          ? "border-brand-violet/50 bg-brand-violet/5"
          : "border-glass-border bg-glass-1 hover:border-glass-border-strong"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex size-3.5 items-center justify-center rounded-full border ${
            checked ? "border-brand-violet" : "border-glass-border-strong"
          }`}
        >
          {checked ? <span className="size-1.5 rounded-full bg-brand-violet" /> : null}
        </span>
        <span className="font-medium text-sm text-text-primary">{label}</span>
      </span>
      <span className="pl-5 text-text-muted text-xs leading-relaxed">{description}</span>
    </button>
  )
}

// ─── Pesos intra-módulo ────────────────────────────────────────────

function PesosIntraModuloSection({ curso, save }: SectionProps) {
  const algunMini = curso.algunModuloConMiniActivo

  const [pesoActividades, setPesoActividades] = useState(String(curso.pesoActividades))
  const [pesoMiniProyecto, setPesoMiniProyecto] = useState(String(curso.pesoMiniProyecto))

  const numActividades = Number.parseFloat(pesoActividades) || 0
  const numMini = Number.parseFloat(pesoMiniProyecto) || 0

  // Suma cruda: lo que se persiste. Constraint SQL `curso_pesos_intra_modulo_suman_100`
  // exige actividades + mini = 100 SIEMPRE. Mandamos PATCH único con ambos
  // valores cuando suman 100, igual que en PesosSection.
  const sumaCruda = numActividades + numMini
  const sumaCrudaOk = Math.abs(sumaCruda - 100) < 0.01
  const algoCambio = numActividades !== curso.pesoActividades || numMini !== curso.pesoMiniProyecto

  useDebouncedSave(`${pesoActividades}|${pesoMiniProyecto}`, () => {
    if (!(algoCambio && sumaCrudaOk)) {
      return
    }
    if (numActividades < 0 || numActividades > 100) {
      return
    }
    if (numMini < 0 || numMini > 100) {
      return
    }
    save({ pesoActividades: numActividades, pesoMiniProyecto: numMini })
  })

  // MAESTRO §9.5: si hay algún módulo con Mini activo, su peso debe ser > 0.
  const miniActivoConPesoCero = algunMini && numMini <= 0

  return (
    <InspectorSection title="Pesos intra-módulo" defaultOpen={false}>
      <p className="text-[11px] text-text-muted">
        Aplica al interior de cada módulo del curso. Los 2 pesos deben sumar 100; mientras no lo
        hagan, los cambios no se guardan. Si ningún módulo activa Mini Proyecto, las actividades
        cubren el 100%.
      </p>
      <InspectorRow label="Actividades (%)">
        <NumberInput
          value={pesoActividades}
          onChange={setPesoActividades}
          min={0}
          max={100}
          step={0.01}
        />
      </InspectorRow>
      <InspectorRow
        label="Mini Proyecto (%)"
        hint={
          algunMini
            ? undefined
            : "Ningún módulo tiene Mini Proyecto activo; este peso solo aplicará si activas el Mini en algún módulo."
        }
      >
        <NumberInput
          value={pesoMiniProyecto}
          onChange={setPesoMiniProyecto}
          min={0}
          max={100}
          step={0.01}
        />
      </InspectorRow>
      {miniActivoConPesoCero ? (
        <p className="text-[11px] text-warning">
          Hay módulos con Mini Proyecto activo. Asigna un peso &gt; 0%. Si no quieres que cuente,
          desactívalo en el módulo.
        </p>
      ) : null}
      <p className={`text-[11px] ${sumaCrudaOk ? "text-success" : "text-warning"}`}>
        Suma: {sumaCruda.toFixed(2)}% {sumaCrudaOk ? "✓" : "(debe ser 100 para guardar)"}
      </p>
    </InspectorSection>
  )
}

// ─── Umbrales ──────────────────────────────────────────────────────

function UmbralesSection({ curso, save }: SectionProps) {
  const [excelencia, setExcelencia] = useState(String(curso.umbralExcelencia))
  const [aprobado, setAprobado] = useState(String(curso.umbralAprobado))
  const [enDesarrollo, setEnDesarrollo] = useState(String(curso.umbralEnDesarrollo))
  const [brecha, setBrecha] = useState(String(curso.umbralBrechaNoCumple))

  useDebouncedSave(excelencia, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n !== curso.umbralExcelencia) {
      save({ umbralExcelencia: n })
    }
  })
  useDebouncedSave(aprobado, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n !== curso.umbralAprobado) {
      save({ umbralAprobado: n })
    }
  })
  useDebouncedSave(enDesarrollo, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n !== curso.umbralEnDesarrollo) {
      save({ umbralEnDesarrollo: n })
    }
  })
  useDebouncedSave(brecha, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n !== curso.umbralBrechaNoCumple) {
      save({ umbralBrechaNoCumple: n })
    }
  })

  const ordenOk =
    Number.parseInt(enDesarrollo, 10) < Number.parseInt(aprobado, 10) &&
    Number.parseInt(aprobado, 10) < Number.parseInt(excelencia, 10)

  return (
    <InspectorSection title="Umbrales de logro" defaultOpen={false}>
      <InspectorRow label="Excelencia ≥">
        <NumberInput value={excelencia} onChange={setExcelencia} min={0} max={100} step={1} />
      </InspectorRow>
      <InspectorRow label="Aprobado ≥">
        <NumberInput value={aprobado} onChange={setAprobado} min={0} max={100} step={1} />
      </InspectorRow>
      <InspectorRow label="En desarrollo ≥">
        <NumberInput value={enDesarrollo} onChange={setEnDesarrollo} min={0} max={100} step={1} />
      </InspectorRow>
      {ordenOk ? null : (
        <p className="text-[11px] text-warning">
          Debe cumplirse: En desarrollo &lt; Aprobado &lt; Excelencia
        </p>
      )}
      <InspectorRow label="Brecha NO_CUMPLE ≥" hint="Distancia mínima al objetivo para alertar.">
        <NumberInput value={brecha} onChange={setBrecha} min={0} max={100} step={1} />
      </InspectorRow>
    </InspectorSection>
  )
}

// ─── Avanzado ──────────────────────────────────────────────────────

function AvanzadoSection({ curso }: { readonly curso: CursoDetalle }) {
  return (
    <InspectorSection title="Avanzado" defaultOpen={false}>
      <InspectorRow label="ID del curso">
        <ReadOnlyValue>
          <code className="font-mono text-text-secondary text-xs">{curso.id}</code>
        </ReadOnlyValue>
      </InspectorRow>
      <InspectorRow label="Estado">
        <ReadOnlyValue>{curso.estado}</ReadOnlyValue>
      </InspectorRow>
      {curso.duplicadoDeId ? (
        <InspectorRow label="Duplicado de">
          <ReadOnlyValue>
            <code className="font-mono text-text-secondary text-xs">{curso.duplicadoDeId}</code>
          </ReadOnlyValue>
        </InspectorRow>
      ) : null}
      <InspectorRow label="Creado">
        <ReadOnlyValue>{formatDateTime(curso.createdAt)}</ReadOnlyValue>
      </InspectorRow>
      <InspectorRow label="Última actualización">
        <ReadOnlyValue>{formatDateTime(curso.updatedAt)}</ReadOnlyValue>
      </InspectorRow>
    </InspectorSection>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────

function ReadOnlyValue({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary">
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
  readonly disabled?: boolean
}

function NumberInput({ value, onChange, min, max, step, disabled }: NumberInputProps) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet disabled:cursor-not-allowed disabled:bg-glass-2 disabled:text-text-muted"
    />
  )
}

interface DateInputProps {
  readonly value: string
  readonly onChange: (v: string) => void
}

function DateInput({ value, onChange }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ colorScheme: "dark" }}
      className="w-full rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
    />
  )
}

function toInputDate(iso: string | null): string {
  if (!iso) {
    return ""
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return ""
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function computeDuracion(inicio: string, deadline: string): string | null {
  if (!(inicio && deadline)) {
    return null
  }
  const a = new Date(inicio).getTime()
  const b = new Date(deadline).getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) {
    return null
  }
  const dias = Math.round((b - a) / (1000 * 60 * 60 * 24))
  if (dias < 7) {
    return `${dias} ${dias === 1 ? "día" : "días"}`
  }
  const semanas = Math.round(dias / 7)
  return `${semanas} ${semanas === 1 ? "semana" : "semanas"}`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
