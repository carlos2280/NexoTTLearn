import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/patterns/badge"
import type { CursoListItem } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ArrowUpRight, Building2, Calendar, Layers, Target, Users } from "lucide-react"
import { ESTADO_META, formatDeadline } from "../lib/format"
import { CursoRowMenu } from "./curso-row-menu"

interface CourseCardProps {
  readonly curso: CursoListItem
  readonly index: number
  readonly onOpen: (curso: CursoListItem) => void
  readonly onEdit: (curso: CursoListItem) => void
  readonly onDuplicate: (curso: CursoListItem) => void
  readonly onSeguimiento: (curso: CursoListItem) => void
  readonly onCandidatos: (curso: CursoListItem) => void
  readonly onUnpublish: (curso: CursoListItem) => void
  readonly onClose: (curso: CursoListItem) => void
  readonly onDelete: (curso: CursoListItem) => void
}

export function CursoCard({
  curso,
  index,
  onOpen,
  onEdit,
  onDuplicate,
  onSeguimiento,
  onCandidatos,
  onUnpublish,
  onClose,
  onDelete,
}: CourseCardProps) {
  const estadoMeta = ESTADO_META[curso.estado]
  const deadline = formatDeadline(curso.deadline)
  const isActivo = curso.estado === "ACTIVO"
  const isCerrado = curso.estado === "CERRADO"
  const showDeadline = !isCerrado

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index, 8) * 0.04,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      // biome-ignore lint/a11y/useSemanticElements: contiene un menu trigger anidado, no puede ser <button>
      role="button"
      tabIndex={0}
      onClick={() => onOpen(curso)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(curso)
        }
      }}
      className={cn(
        "group relative flex h-full flex-col gap-4",
        "rounded-[var(--radius-xl)] border border-glass-border bg-glass-1 p-5 text-left",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-glass-border-strong",
        "hover:shadow-[0_28px_70px_-20px_rgb(124_58_237/0.35)]",
        "focus-visible:border-brand-violet focus-visible:outline-none",
        "focus-visible:shadow-[0_0_0_4px_rgb(124_58_237/0.18)]",
      )}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
            isActivo
              ? "bg-[var(--gradient-brand-soft)] text-brand-violet-soft"
              : "bg-glass-2 text-text-secondary",
          )}
        >
          <Building2 className="size-5" strokeWidth={1.5} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium text-text-muted text-xs uppercase tracking-wider">
            {curso.empresaCliente}
          </span>
          <h3 className="line-clamp-2 font-semibold text-base text-text-primary leading-tight tracking-tight">
            {curso.titulo}
          </h3>
        </div>
        <CursoRowMenu
          curso={curso}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onSeguimiento={onSeguimiento}
          onCandidatos={onCandidatos}
          onUnpublish={onUnpublish}
          onClose={onClose}
          onDelete={onDelete}
        />
      </header>

      <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
        <Badge tone={estadoMeta.tone} size="sm" dot={true}>
          {estadoMeta.label}
        </Badge>
        {curso.descripcion ? (
          <span className="line-clamp-1 text-text-muted text-xs">{curso.descripcion}</span>
        ) : null}
      </div>

      <dl className="grid grid-cols-3 gap-2 border-glass-border border-t pt-4">
        <Metric icon={Users} label="Partic." value={curso.contadores.inscripcionesActivas} />
        <Metric icon={Target} label="Áreas" value={curso.contadores.areas} />
        <Metric icon={Layers} label="Módulos" value={curso.contadores.modulos} />
      </dl>

      <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
        {showDeadline ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              deadline.tone === "danger" && "text-danger",
              deadline.tone === "warning" && "text-warning",
              deadline.tone === "neutral" && "text-text-muted",
            )}
          >
            <Calendar className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            {deadline.label}
          </span>
        ) : (
          <span className="text-text-muted text-xs">Cerrado</span>
        )}
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex items-center gap-1",
            "font-semibold text-brand-violet-soft text-xs",
            "transition-transform group-hover:translate-x-0.5",
          )}
        >
          {isCerrado ? "Ver" : "Abrir"}
          <ArrowUpRight className="size-3.5" strokeWidth={2} />
        </span>
      </footer>
    </motion.article>
  )
}

interface MetricProps {
  readonly icon: typeof Users
  readonly label: string
  readonly value: number
}

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-text-muted text-xs">
        <Icon className="size-3" strokeWidth={1.75} aria-hidden="true" />
        {label}
      </span>
      <span className="font-semibold text-sm text-text-primary tabular-nums">{value}</span>
    </div>
  )
}
