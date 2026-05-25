import { useCursosDashboard } from "@/features/admin/dashboard/hooks/use-cursos-dashboard"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Section } from "@/shared/components/ui/section"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import { DUR, EASE } from "@/shared/lib/motion"
import type { CursoResumen } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, Calendar } from "lucide-react"
import { Link } from "react-router-dom"

const MAX_VISIBLES = 6
const MS_POR_DIA = 24 * 60 * 60 * 1000

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  })
}

function calcularProgreso(inicioIso: string, deadlineIso: string): number {
  const inicio = new Date(inicioIso).getTime()
  const fin = new Date(deadlineIso).getTime()
  const ahora = Date.now()
  if (fin <= inicio) {
    return 0
  }
  const pct = ((ahora - inicio) / (fin - inicio)) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

function calcularDiasRestantes(deadlineIso: string): number {
  return Math.ceil((new Date(deadlineIso).getTime() - Date.now()) / MS_POR_DIA)
}

function urgenciaDeDias(dias: number): "vencido" | "urgente" | "proximo" | "lejos" {
  if (dias < 0) {
    return "vencido"
  }
  if (dias <= 3) {
    return "urgente"
  }
  if (dias <= 14) {
    return "proximo"
  }
  return "lejos"
}

interface TarjetaCursoProps {
  readonly curso: CursoResumen
  readonly indice: number
}

function TarjetaCurso({ curso, indice }: TarjetaCursoProps) {
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.07
  const progreso = calcularProgreso(curso.fechaInicio, curso.fechaDeadline)
  const diasRestantes = calcularDiasRestantes(curso.fechaDeadline)
  const urgencia = urgenciaDeDias(diasRestantes)

  const etiquetaDias =
    urgencia === "vencido" ? "Vencido" : diasRestantes === 0 ? "Hoy" : `${diasRestantes}d`

  const colorDias =
    urgencia === "vencido" || urgencia === "urgente"
      ? "text-danger-on-soft"
      : urgencia === "proximo"
        ? "text-warning-on-soft"
        : "text-text-tertiary"

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.storytelling, delay, ease: EASE.default }}
    >
      <Card tono="plano" interactiva={true} densidad="none" asChild={true}>
        <Link
          to={RUTAS.admin.cursoDetalle(curso.id)}
          className="group flex h-full flex-col gap-4 p-5"
        >
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="nx-eyebrow text-text-tertiary">En curso</span>
              <h3 className="line-clamp-2 text-h3 text-text-primary leading-tight transition-colors group-hover:text-accent">
                {curso.titulo}
              </h3>
            </div>
            <ArrowUpRight
              className="group-hover:-translate-y-0.5 mt-1 h-4 w-4 shrink-0 text-text-tertiary transition-all duration-fast ease-default group-hover:translate-x-0.5 group-hover:text-accent"
              strokeWidth={1.5}
              aria-hidden={true}
            />
          </header>

          <div className="flex items-center gap-3 text-caption text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.5} aria-hidden={true} />
              {formatearFecha(curso.fechaInicio)} → {formatearFecha(curso.fechaDeadline)}
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="nx-eyebrow text-text-tertiary">Avance temporal</span>
              <div className="flex items-baseline gap-2">
                <span className="tabular font-mono font-semibold text-body-sm text-text-primary">
                  {progreso}%
                </span>
                <span className={cn("tabular font-mono text-caption", colorDias)}>
                  {etiquetaDias}
                </span>
              </div>
            </div>
            <div aria-hidden={true} className="relative h-1 overflow-hidden rounded-pill bg-subtle">
              <div
                className="absolute inset-y-0 left-0 rounded-pill bg-[image:var(--gradient-aurora)]"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  )
}

function EstadoVacio() {
  return (
    <Card tono="plano" className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-body text-text-secondary">Aún no hay cursos en curso.</p>
      <p className="text-caption text-text-tertiary">
        Publica un borrador desde Cursos para verlo aquí.
      </p>
    </Card>
  )
}

export function CursosEnMarcha() {
  const { data, isLoading } = useCursosDashboard()
  const activos = (data?.data ?? []).filter((c) => c.estado === "ACTIVO").slice(0, MAX_VISIBLES)

  return (
    <Section
      id="cursos-en-marcha"
      eyebrow="En vuelo"
      titulo="Cursos en curso"
      descripcion="Lo que está corriendo ahora mismo y su próximo hito."
      accion={
        <Button variant="ghost" size="sm" asChild={true}>
          <Link to={RUTAS.admin.cursos}>Ir a cursos</Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`skeleton-${i + 1}`}
              className="h-[160px] animate-pulse rounded-2xl border border-border bg-subtle"
            />
          ))}
        </div>
      ) : activos.length === 0 ? (
        <EstadoVacio />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activos.map((curso, i) => (
            <TarjetaCurso key={curso.id} curso={curso} indice={i} />
          ))}
        </div>
      )}
    </Section>
  )
}
