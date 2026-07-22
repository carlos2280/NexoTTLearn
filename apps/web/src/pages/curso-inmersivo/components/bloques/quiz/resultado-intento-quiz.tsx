import { cn } from "@/shared/lib/cn"
import type { ContenidoQuiz, IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, RotateCcw } from "lucide-react"

interface ResultadoIntentoQuizProps {
  /** `null` mientras no se haya enviado ningún intento. El componente se monta
   *  igual (región live persistente), solo cambia su contenido. */
  readonly intento: IntentoBloqueResponse | null
  readonly notaMinima: number
  readonly totalPreguntas: number
  /**
   * Mejor intento *previo* al actual. Sirve para distinguir entre "primera vez
   * que apruebas" (banner caluroso) y "ya estabas aprobado y reintentaste"
   * (banner sobrio). `null` si nunca habia intentado.
   */
  readonly mejorPrevio: IntentoBloqueResponse | null
  /**
   * Si `false`, el veredicto NO se anuncia por la región live (solo la vista
   * visual). En modo revisión — al volver a un quiz ya aprobado — no es una
   * acción nueva, así que evitamos el anuncio y su no-determinismo por caché.
   */
  readonly anunciar?: boolean
}

interface VeredictoQuiz {
  readonly aprobado: boolean
  readonly primeraVez: boolean
  readonly acertadas: number
  readonly nota: number
  readonly mensaje: string
}

export function ResultadoIntentoQuiz({
  intento,
  notaMinima,
  totalPreguntas,
  mejorPrevio,
  anunciar = true,
}: ResultadoIntentoQuizProps) {
  const veredicto = intento
    ? evaluarVeredictoQuiz(intento, notaMinima, totalPreguntas, mejorPrevio)
    : null
  const fraseAccesible =
    veredicto && anunciar
      ? `${veredicto.nota} por ciento. Acertaste ${veredicto.acertadas} de ${totalPreguntas}. ${veredicto.mensaje}`
      : ""
  return (
    <>
      {/* Región live persistente: se monta SIEMPRE y su texto pasa de "" al
          veredicto completo → anuncio fiable (una región `status` insertada ya
          poblada suele NO anunciarse). WCAG 2.2 §4.1.3. */}
      <output className="sr-only">{fraseAccesible}</output>
      {veredicto ? (
        <BannerQuiz veredicto={veredicto} notaMinima={notaMinima} totalPreguntas={totalPreguntas} />
      ) : null}
    </>
  )
}

function BannerQuiz({
  veredicto,
  notaMinima,
  totalPreguntas,
}: {
  readonly veredicto: VeredictoQuiz
  readonly notaMinima: number
  readonly totalPreguntas: number
}) {
  const { aprobado, primeraVez, acertadas, nota, mensaje } = veredicto
  const Icono = aprobado ? CheckCircle2 : RotateCcw
  return (
    // aria-hidden: el `<output>` de arriba ya anuncia todo esto; esto es la vista.
    <aside
      aria-hidden={true}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        aprobado ? "border-success/30 bg-success-soft" : "border-warmth/30 bg-warning-soft",
        primeraVez && "nx-aurora-pulse",
      )}
    >
      <Icono
        className={cn("mt-0.5 h-5 w-5 shrink-0", aprobado ? "text-success" : "text-warmth")}
        aria-hidden={true}
      />
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={cn(
              "tabular font-mono font-semibold text-body",
              aprobado ? "text-success-on-soft" : "text-warning-on-soft",
            )}
          >
            {nota}%
          </span>
          <span className="text-caption text-text-tertiary">
            Acertaste {acertadas} de {totalPreguntas} · umbral {notaMinima}%
          </span>
        </div>
        <p
          className={cn("text-body-sm", aprobado ? "text-success-on-soft" : "text-warning-on-soft")}
        >
          {mensaje}
        </p>
      </div>
    </aside>
  )
}

function evaluarVeredictoQuiz(
  intento: IntentoBloqueResponse,
  notaMinima: number,
  totalPreguntas: number,
  mejorPrevio: IntentoBloqueResponse | null,
): VeredictoQuiz {
  const aprobado = intento.nota >= notaMinima
  const yaEstabaAprobado = (mejorPrevio?.nota ?? -1) >= notaMinima
  const primeraVez = aprobado && !yaEstabaAprobado
  const acertadas = totalPreguntas - intento.preguntasFalladas.length
  return {
    aprobado,
    primeraVez,
    acertadas,
    nota: Math.round(intento.nota),
    mensaje: construirMensaje({ aprobado, primeraVez }),
  }
}

function construirMensaje(args: { aprobado: boolean; primeraVez: boolean }): string {
  if (args.primeraVez) {
    return "Lo lograste. Acabas de demostrar capacidad nueva."
  }
  if (args.aprobado) {
    return "Aprobado. Tu mejor intento sigue contando."
  }
  return "Aún no. Tienes intentos ilimitados — la mejor cuenta."
}

export function decidirMostrarSolucion(
  modo: ContenidoQuiz["solucionVisible"],
  haIntentado: boolean,
  aprobado: boolean,
): boolean {
  if (!haIntentado) {
    return false
  }
  if (modo === "tras_intento") {
    return true
  }
  if (modo === "al_aprobar") {
    return aprobado
  }
  return false
}
