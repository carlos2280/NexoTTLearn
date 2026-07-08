import { cn } from "@/shared/lib/cn"
import type { IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, RotateCcw } from "lucide-react"

interface ResultadoIntentoProps {
  /** `null` mientras no se haya enviado ningún intento. El componente se monta
   *  igual (región live persistente), solo cambia su contenido. */
  readonly intento: IntentoBloqueResponse | null
  readonly notaAprobado: number
  /**
   * Mejor intento *previo* al actual (antes de enviar). Permite distinguir
   * primera aprobacion de un re-envio cuando ya estabas aprobado.
   */
  readonly mejorPrevio: IntentoBloqueResponse | null
}

interface Veredicto {
  readonly aprobado: boolean
  readonly primeraVez: boolean
  readonly mensaje: string
}

export function ResultadoIntento({ intento, notaAprobado, mejorPrevio }: ResultadoIntentoProps) {
  const veredicto = intento ? evaluarVeredicto(intento.nota, notaAprobado, mejorPrevio) : null
  return (
    <>
      {/* Región live persistente: se monta SIEMPRE (aunque no haya intento) y su
          texto pasa de "" al veredicto → anuncio fiable. Una región `status`
          insertada en el DOM ya poblada suele NO anunciarse (JAWS/NVDA). WCAG 2.2 §4.1.3. */}
      <output className="sr-only">{veredicto?.mensaje ?? ""}</output>
      {veredicto ? <BannerVeredicto veredicto={veredicto} /> : null}
    </>
  )
}

function BannerVeredicto({ veredicto }: { readonly veredicto: Veredicto }) {
  const { aprobado, primeraVez, mensaje } = veredicto
  const Icono = aprobado ? CheckCircle2 : RotateCcw
  return (
    <aside
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
      <p className={cn("text-body-sm", aprobado ? "text-success-on-soft" : "text-warning-on-soft")}>
        {mensaje}
      </p>
    </aside>
  )
}

function evaluarVeredicto(
  nota: number,
  notaAprobado: number,
  mejorPrevio: IntentoBloqueResponse | null,
): Veredicto {
  const aprobado = nota >= notaAprobado
  const yaEstabaAprobado = (mejorPrevio?.nota ?? -1) >= notaAprobado
  const primeraVez = aprobado && !yaEstabaAprobado
  return { aprobado, primeraVez, mensaje: construirMensaje({ aprobado, primeraVez }) }
}

function construirMensaje(args: { aprobado: boolean; primeraVez: boolean }): string {
  if (args.primeraVez) {
    return "Lo lograste. Acabas de demostrar capacidad nueva."
  }
  if (args.aprobado) {
    return "Aprobado. Tu mejor intento sigue contando."
  }
  return "Aún no. Revisa los tests que fallaron y vuelve a intentarlo — la mejor cuenta."
}
