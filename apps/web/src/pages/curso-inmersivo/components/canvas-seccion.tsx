import { useBloquesDeSeccion } from "@/features/me/hooks/use-bloques-de-seccion"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { DUR, EASE } from "@/shared/lib/motion"
import {
  type BloqueDetalleResponse,
  type ContenidoCodigoTests,
  type ModoCursoParticipante,
  contenidoCodigoTestsSchema,
} from "@nexott-learn/shared-types"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { BookOpen } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import type { SeccionActiva } from "../hooks/use-seccion-activa"
import { RenderBloque } from "./bloques/render-bloque"

interface CanvasSeccionProps {
  readonly seccionActiva: SeccionActiva | null
  readonly modo: ModoCursoParticipante
  readonly cursoId: string
  readonly colaboradorId: string | null
}

/**
 * Canvas central del modo inmersivo (Sub-capa D · polish). Al cambiar de
 * sección anima un fade-slide breve (movimiento contenido del manifiesto:
 * spring suave, no más alto que la altura del elemento) y resetea el scroll
 * al top para que el participante siempre aterrice en la cabecera.
 */
export function CanvasSeccion({ seccionActiva, modo, cursoId, colaboradorId }: CanvasSeccionProps) {
  const bloques = useBloquesDeSeccion(seccionActiva?.seccionId ?? null)
  const mainRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const testsPorPreguntaId = useMemo(
    () => indexarTestsPorPregunta(bloques.data ?? []),
    [bloques.data],
  )

  // Auto-scroll al top al cambiar de sección.
  useEffect(() => {
    if (!seccionActiva) {
      return
    }
    mainRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })
  }, [seccionActiva, reducedMotion])

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

function CabeceraSeccion({
  seccion,
  modo,
}: {
  readonly seccion: SeccionActiva
  readonly modo: ModoCursoParticipante
}) {
  return (
    <header className="flex flex-col gap-2">
      <span className="nx-eyebrow text-aurora-violet">{eyebrowDeSeccion(seccion, modo)}</span>
      <h2 className="text-display-md text-text-primary leading-tight">{seccion.titulo}</h2>
      <p className="text-body-sm text-text-tertiary">{copySubtitulo(seccion, modo)}</p>
    </header>
  )
}

function eyebrowDeSeccion(seccion: SeccionActiva, modo: ModoCursoParticipante): string {
  if (modo === "preview") {
    return "Vista previa"
  }
  if (seccion.caracter === "OPCIONAL") {
    return "Sección opcional"
  }
  return "Sección"
}

function copySubtitulo(seccion: SeccionActiva, modo: ModoCursoParticipante): string {
  if (modo === "preview") {
    return "Inscríbete como voluntario para responder los bloques evaluables y guardar tu progreso."
  }
  if (seccion.completada) {
    return "Ya completaste esta sección. Puedes repasarla cuando quieras."
  }
  if (seccion.avance && seccion.avance.bloquesTotales > 0) {
    return `${seccion.avance.bloquesCompletados} de ${seccion.avance.bloquesTotales} bloques evaluables completados.`
  }
  return "Sección de lectura — se marca como completada al abrirla."
}

function CargandoBloques() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

function ErrorBloques() {
  return (
    <article className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-body-sm text-danger-on-soft">
      No pudimos cargar los bloques de esta sección. Reintenta en un momento.
    </article>
  )
}

function SeccionVacia() {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-border border-dashed bg-canvas p-8 text-center">
      <span className="nx-eyebrow text-text-tertiary">Sin bloques aún</span>
      <p className="text-body text-text-secondary">
        El administrador todavía no añadió contenido a esta sección.
      </p>
    </article>
  )
}

interface CentradoProps {
  readonly icono: typeof BookOpen
  readonly titulo: string
  readonly descripcion: string
}

/**
 * Recorre los bloques de la sección, parsea el contenido de cada `CODIGO_TESTS`
 * y devuelve un Map indexado por `codigoPreguntasId` para que el render del
 * bloque `CODIGO_PREGUNTAS` pueda ejecutar los tests en el navegador.
 */
function indexarTestsPorPregunta(
  bloques: readonly BloqueDetalleResponse[],
): ReadonlyMap<string, ContenidoCodigoTests> {
  const indice = new Map<string, ContenidoCodigoTests>()
  for (const bloque of bloques) {
    if (bloque.tipo !== "CODIGO_TESTS") {
      continue
    }
    const parsed = contenidoCodigoTestsSchema.safeParse(bloque.contenido)
    if (!parsed.success) {
      continue
    }
    indice.set(parsed.data.codigoPreguntasId, parsed.data)
  }
  return indice
}

function Centrado({ icono: Icono, titulo, descripcion }: CentradoProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <article className="flex max-w-md flex-col items-center gap-3 text-center">
        <span
          aria-hidden={true}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent-on-soft"
        >
          <Icono className="h-6 w-6" />
        </span>
        <h2 className="text-h2 text-text-primary">{titulo}</h2>
        <p className="text-body text-text-secondary">{descripcion}</p>
      </article>
    </main>
  )
}
