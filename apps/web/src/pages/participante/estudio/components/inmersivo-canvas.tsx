import { RenderBloque } from "@/features/bloques-runtime/components/render-bloque"
import type { ModuloInmersivo, SeccionInmersiva } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { Fragment } from "react"

interface InmersivoCanvasProps {
  readonly modulo: ModuloInmersivo
  readonly secciones: readonly SeccionInmersiva[]
  readonly bloqueActualId: string | null
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// Canvas de estudio (canvas-bloques.md §2). max-width 760 px de lectura comoda,
// scroll natural. Cada seccion abre con header + bloques apilados. Animacion
// de entrada con stagger (160 ms inicial + 60 ms por bloque · feedback_nexott_rules).
// Respeta prefers-reduced-motion: con el flag activo se neutralizan delay y
// translate, manteniendo solo un fade minimo.

export function InmersivoCanvas({ modulo, secciones, bloqueActualId }: InmersivoCanvasProps) {
  const reduceMotion = useReducedMotion() ?? false
  let bloqueIndex = 0

  return (
    <main className="flex-1 scroll-pt-[var(--inmersivo-header-h)] overflow-y-auto">
      <div className="mx-auto flex max-w-reading flex-col gap-8 px-10 py-12">
        <ModuloHeader
          titulo={modulo.titulo}
          posicionLabel={modulo.posicionLabel}
          reduceMotion={reduceMotion}
        />
        {secciones.map((seccion, sIdx) => (
          <Fragment key={seccion.id}>
            <SeccionHeader
              orden={seccion.orden}
              total={secciones.length}
              titulo={seccion.titulo}
              cantidadBloques={seccion.bloques.length}
              delaySegundos={reduceMotion ? 0 : 0.12 + sIdx * 0.06}
              reduceMotion={reduceMotion}
            />
            <div className="flex flex-col gap-8">
              {seccion.bloques.map((bloque) => {
                const delay = reduceMotion ? 0 : 0.16 + bloqueIndex * 0.06
                bloqueIndex += 1
                return (
                  <motion.div
                    key={bloque.id}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0.16 : 0.36, ease: EASE_OUT, delay }}
                  >
                    <RenderBloque bloque={bloque} esActual={bloque.id === bloqueActualId} />
                  </motion.div>
                )
              })}
            </div>
          </Fragment>
        ))}
        <FooterEspaciado />
      </div>
    </main>
  )
}

function ModuloHeader({
  titulo,
  posicionLabel,
  reduceMotion,
}: {
  readonly titulo: string
  readonly posicionLabel: string
  readonly reduceMotion: boolean
}) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.16 : 0.36, ease: EASE_OUT }}
      className="flex flex-col gap-2"
    >
      <span className="inline-flex w-fit items-center rounded-full border border-glass-border bg-glass-1 px-2.5 py-0.5 font-semibold text-eyebrow text-text-muted uppercase">
        {posicionLabel}
      </span>
      <h1 className="font-bold text-display text-text-primary">{titulo}</h1>
    </motion.div>
  )
}

interface SeccionHeaderProps {
  readonly orden: number
  readonly total: number
  readonly titulo: string
  readonly cantidadBloques: number
  readonly delaySegundos: number
  readonly reduceMotion: boolean
}

function SeccionHeader({
  orden,
  total,
  titulo,
  cantidadBloques,
  delaySegundos,
  reduceMotion,
}: SeccionHeaderProps) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.16 : 0.32,
        ease: EASE_OUT,
        delay: delaySegundos,
      }}
      className="flex flex-col gap-2 border-glass-border border-b pb-4"
    >
      <span className="inline-flex w-fit items-center rounded-full bg-glass-1 px-2.5 py-0.5 font-semibold text-eyebrow text-text-muted uppercase">
        Seccion {orden} de {total}
      </span>
      <h2 className="font-bold text-h2 text-text-primary">{titulo}</h2>
      <p className="text-text-muted text-xs">
        {cantidadBloques} {cantidadBloques === 1 ? "contenido" : "contenidos"} en esta seccion
      </p>
    </motion.div>
  )
}

function FooterEspaciado() {
  // Aire bajo el ultimo bloque para que pueda quedar en viewport sin tocar
  // el dock sticky. Tokenizado: --inmersivo-canvas-bottom-pad.
  return <div aria-hidden={true} className="h-canvas-bottom" />
}
