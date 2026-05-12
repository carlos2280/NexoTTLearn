import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Section } from "@/shared/components/ui/section"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, Clock3 } from "lucide-react"
import { MOCK_CASOS } from "../inicio.mock"
import type { CasoRevision, PrioridadCaso } from "../inicio.types"

const ETIQUETA_PRIORIDAD: Record<PrioridadCaso, string> = {
  urgente: "Urgente",
  alta: "Alta",
  normal: "Normal",
}

const TONO_PRIORIDAD: Record<PrioridadCaso, "danger" | "warning" | "neutro"> = {
  urgente: "danger",
  alta: "warning",
  normal: "neutro",
}

function FilaCaso({ caso, indice }: { readonly caso: CasoRevision; readonly indice: number }) {
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.05

  return (
    <motion.li
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.page, delay, ease: EASE.default }}
      className="group"
    >
      <button
        type="button"
        className="flex w-full items-start gap-4 rounded-md px-3 py-3 text-left transition-colors duration-fast ease-default hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <span className="mt-2 flex h-2 w-2 shrink-0 items-center justify-center" aria-hidden={true}>
          <span
            className={`block h-2 w-2 rounded-pill ${
              caso.prioridad === "urgente"
                ? "bg-danger"
                : caso.prioridad === "alta"
                  ? "bg-warning"
                  : "bg-text-tertiary"
            }`}
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-body text-text-primary">{caso.titulo}</h3>
            <Badge tono={TONO_PRIORIDAD[caso.prioridad]} conPunto={false}>
              {ETIQUETA_PRIORIDAD[caso.prioridad]}
            </Badge>
          </div>
          <p className="truncate text-body-sm text-text-secondary">{caso.contexto}</p>
          <div className="flex flex-wrap items-center gap-3 text-caption text-text-tertiary">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
              {caso.slaRestante}
            </span>
            <span className="text-border-strong">·</span>
            <span>Responsable: {caso.responsable}</span>
          </div>
        </div>
        <ArrowUpRight
          className="group-hover:-translate-y-0.5 mt-1 h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-fast ease-default group-hover:translate-x-0.5 group-hover:text-accent"
          strokeWidth={1.5}
          aria-hidden={true}
        />
      </button>
    </motion.li>
  )
}

export function CentroRevision() {
  return (
    <Section
      id="centro-revision"
      eyebrow="Bandeja de decisión"
      titulo="Centro de revisión"
      descripcion="Lo que está a punto de vencer o requiere que alguien decida."
      accion={
        <Button variant="ghost" size="sm">
          Ver todo
        </Button>
      }
    >
      <Card tono="plano" densidad="none">
        <ul className="flex flex-col divide-y divide-border p-2">
          {MOCK_CASOS.map((caso, i) => (
            <FilaCaso key={caso.id} caso={caso} indice={i} />
          ))}
        </ul>
      </Card>
    </Section>
  )
}
