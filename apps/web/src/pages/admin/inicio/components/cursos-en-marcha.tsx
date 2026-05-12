import { useCursosDashboard } from "@/features/admin/dashboard/hooks/use-cursos-dashboard"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Section } from "@/shared/components/ui/section"
import { RUTAS } from "@/shared/constants/rutas"
import { DUR, EASE } from "@/shared/lib/motion"
import type { CursoResumen } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarClock, Flag } from "lucide-react"
import { Link } from "react-router-dom"

const MAX_VISIBLES = 6

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function TarjetaCurso({
  curso,
  indice,
}: { readonly curso: CursoResumen; readonly indice: number }) {
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.07

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.storytelling, delay, ease: EASE.default }}
    >
      <Card tono="plano" interactiva={true} className="flex h-full flex-col gap-4" asChild={true}>
        <Link to={RUTAS.admin.cursoDetalle(curso.id)}>
          <header className="flex flex-col gap-2">
            <Badge tono="contorno">Activo</Badge>
            <h3 className="line-clamp-2 text-body text-text-primary">{curso.titulo}</h3>
          </header>

          <div className="flex flex-col gap-1.5 text-caption text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden={true} />
              Inicio: {formatearFecha(curso.fechaInicio)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock
                className="h-3.5 w-3.5 shrink-0"
                strokeWidth={1.5}
                aria-hidden={true}
              />
              Deadline: {formatearFecha(curso.fechaDeadline)}
            </span>
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
            <Card key={`skeleton-${i + 1}`} tono="plano" className="h-[140px] animate-pulse" />
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
