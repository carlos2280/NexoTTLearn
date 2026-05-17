import { useBloquesDeSeccion } from "@/features/me/hooks/use-bloques-de-seccion"
import { DUR, EASE } from "@/shared/lib/motion"
import type { ModoCursoParticipante } from "@nexott-learn/shared-types"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { BookOpen } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import type { SeccionActiva } from "../hooks/use-seccion-activa"
import { RenderBloque } from "./bloques/render-bloque"
import { CabeceraSeccion } from "./canvas/cabecera-seccion"
import { CargandoBloques, Centrado, ErrorBloques, SeccionVacia } from "./canvas/canvas-estados"
import { indexarTestsPorPregunta } from "./canvas/indexar-tests-por-pregunta"

interface CanvasSeccionProps {
  readonly seccionActiva: SeccionActiva | null
  readonly modo: ModoCursoParticipante
  readonly cursoId: string
  readonly colaboradorId: string | null
  readonly soloLectura: boolean
}

/**
 * Canvas central del modo inmersivo (Sub-capa D · polish). Al cambiar de
 * sección anima un fade-slide breve (movimiento contenido del manifiesto:
 * spring suave, no más alto que la altura del elemento) y resetea el scroll
 * al top para que el participante siempre aterrice en la cabecera.
 */
export function CanvasSeccion({
  seccionActiva,
  modo,
  cursoId,
  colaboradorId,
  soloLectura,
}: CanvasSeccionProps) {
  const bloques = useBloquesDeSeccion(seccionActiva?.seccionId ?? null)
  const mainRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const testsPorPreguntaId = useMemo(
    () => indexarTestsPorPregunta(bloques.data ?? []),
    [bloques.data],
  )

  // Auto-scroll al top SOLO cuando el id de la seccion cambia. Antes
  // dependiamos del objeto `seccionActiva` completo: como el hook
  // `useSeccionActiva` reconstruye la referencia en cada refetch del plan
  // (Tanstack Query trae datos nuevos tras un intento), el efecto disparaba
  // scroll al top tras enviar un quiz/codigo, expulsando al participante.
  const seccionActivaId = seccionActiva?.seccionId ?? null
  useEffect(() => {
    if (seccionActivaId === null) {
      return
    }
    mainRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })
  }, [seccionActivaId, reducedMotion])

  if (!seccionActiva) {
    return (
      <Centrado
        icono={BookOpen}
        titulo="Elige una sección."
        descripcion={
          modo === "asignado"
            ? "Selecciona una sección del plan a la izquierda para empezar a estudiar."
            : "Selecciona una sección a la izquierda para explorar el curso."
        }
      />
    )
  }

  const transicion = reducedMotion ? { duration: 0 } : { duration: DUR.base, ease: EASE.default }
  const colaboradorParaBloques = modo === "preview" ? null : colaboradorId

  return (
    <main ref={mainRef} className="flex flex-1 flex-col overflow-y-auto px-8 py-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={seccionActiva.seccionId}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
          transition={transicion}
          className="flex flex-col gap-8"
        >
          <CabeceraSeccion seccion={seccionActiva} modo={modo} />
          {bloques.isLoading ? <CargandoBloques /> : null}
          {bloques.error ? <ErrorBloques /> : null}
          {bloques.data && bloques.data.length === 0 ? <SeccionVacia /> : null}
          {bloques.data && bloques.data.length > 0 ? (
            <ol className="flex flex-col gap-6">
              {bloques.data.map((bloque) => (
                <li key={bloque.id}>
                  <RenderBloque
                    bloque={bloque}
                    cursoId={cursoId}
                    colaboradorId={colaboradorParaBloques}
                    modo={modo}
                    contenidoTests={testsPorPreguntaId.get(bloque.id) ?? null}
                    soloLectura={soloLectura}
                  />
                </li>
              ))}
            </ol>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
