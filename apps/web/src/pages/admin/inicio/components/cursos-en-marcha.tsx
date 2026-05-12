import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { ProgressRing } from "@/shared/components/ui/progress-ring"
import { Section } from "@/shared/components/ui/section"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarClock } from "lucide-react"
import { MOCK_CURSOS } from "../inicio.mock"
import type { CursoEnMarcha } from "../inicio.types"

function PilaResponsables({ responsables }: { readonly responsables: readonly string[] }) {
  const visibles = responsables.slice(0, 3)
  const restantes = responsables.length - visibles.length
  return (
    <div className="-space-x-2 flex items-center">
      {visibles.map((nombre) => (
        <div key={nombre} className="rounded-full ring-2 ring-surface">
          <AvatarIniciales nombre={nombre} tamano="sm" />
        </div>
      ))}
      {restantes > 0 ? (
        <span className="inline-flex h-7 items-center justify-center rounded-full bg-subtle px-2 text-caption text-text-secondary ring-2 ring-surface">
          +{restantes}
        </span>
      ) : null}
    </div>
  )
}

function tonoAvance(avance: number): "acento" | "success" | "warning" {
  if (avance >= 80) {
    return "success"
  }
  if (avance >= 50) {
    return "acento"
  }
  return "warning"
}

function TarjetaCurso({
  curso,
  indice,
}: { readonly curso: CursoEnMarcha; readonly indice: number }) {
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.07

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.storytelling, delay, ease: EASE.default }}
    >
      <Card tono="plano" interactiva={true} className="flex h-full flex-col gap-5" asChild={true}>
        <article>
          <header className="flex items-start gap-4">
            <ProgressRing
              valor={curso.avance}
              tamano={56}
              grosor={5}
              tono={tonoAvance(curso.avance)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Badge tono="contorno">{curso.cliente}</Badge>
              <h3 className="line-clamp-2 text-body text-text-primary">{curso.titulo}</h3>
            </div>
          </header>

          <div className="flex items-center justify-between gap-3">
            <PilaResponsables responsables={curso.responsables} />
            <span className="tabular text-caption text-text-tertiary">
              {curso.participantes} personas
            </span>
          </div>

          <footer className="-mx-5 -mb-5 mt-1 flex items-center gap-2 border-border border-t bg-subtle/40 px-5 py-3 text-caption text-text-secondary">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden={true} />
            <span className="truncate">{curso.proximoHito}</span>
          </footer>
        </article>
      </Card>
    </motion.div>
  )
}

export function CursosEnMarcha() {
  return (
    <Section
      id="cursos-en-marcha"
      eyebrow="En vuelo"
      titulo="Cursos en curso"
      descripcion="Lo que está corriendo ahora mismo y su próximo hito."
      accion={
        <Button variant="ghost" size="sm">
          Ir a cursos
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_CURSOS.map((curso, i) => (
          <TarjetaCurso key={curso.id} curso={curso} indice={i} />
        ))}
      </div>
    </Section>
  )
}
