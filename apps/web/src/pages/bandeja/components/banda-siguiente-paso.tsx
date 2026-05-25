import { Button } from "@/shared/components/ui/button"
import { SaludoBienvenida } from "@/shared/components/ui/saludo-bienvenida"
import { RUTAS } from "@/shared/constants/rutas"
import type { SiguienteAccion } from "@nexott-learn/shared-types"
import { Compass } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { microcopyDelSaludo } from "../lib/microcopy-saludo"
import { type ContextoAreaCurso, obtenerCopy } from "../lib/siguiente-accion-copy"
import { CartaSiguientePaso } from "./carta-siguiente-paso"

interface BandaSiguientePasoProps {
  readonly siguienteAccion: SiguienteAccion | null
  readonly nombreUsuario: string
  readonly saludo: string
  /** Área principal del curso destino de `siguienteAccion`, si la hay. */
  readonly contextoArea: ContextoAreaCurso | null
}

/**
 * Bloque 1 de la bandeja — saludo + hero único que responde "¿qué hago ahora?".
 *
 * El saludo es la firma emocional de bienvenida al viaje (capa 1). El hero
 * delega en `CartaSiguientePaso` y pasa el contexto del área del curso
 * destino para que la carta pinte barra superior + eyebrow `ÁREA · TÍTULO`
 * cuando aplique (capa 2). Aurora se reserva para culminaciones.
 */
export function BandaSiguientePaso({
  siguienteAccion,
  nombreUsuario,
  saludo,
  contextoArea,
}: BandaSiguientePasoProps) {
  const navigate = useNavigate()

  return (
    <section aria-labelledby="siguiente-paso-titulo" className="flex flex-col gap-6">
      <SaludoBienvenida
        saludo={saludo}
        nombre={nombreUsuario || null}
        microcopy={microcopyDelSaludo(siguienteAccion)}
        tituloId="siguiente-paso-titulo"
      />
      {siguienteAccion === null ? (
        <CartaSinActividad onExplorar={() => navigate(RUTAS.participante.catalogo)} />
      ) : (
        <CartaSiguientePaso copy={obtenerCopy(siguienteAccion, contextoArea ?? undefined)} />
      )}
    </section>
  )
}

function CartaSinActividad({ onExplorar }: { readonly onExplorar: () => void }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border border-dashed bg-canvas p-7">
      <span className="nx-eyebrow text-text-tertiary">Aún sin actividad</span>
      <h2 className="text-h2 text-text-primary">No tienes cursos asignados todavía.</h2>
      <p className="max-w-prose text-body text-text-secondary">
        Cuando el administrador te asigne uno, lo verás aquí. Mientras tanto, puedes inscribirte por
        tu cuenta a los cursos abiertos.
      </p>
      <div className="mt-2">
        <Button onClick={onExplorar}>
          <Compass className="mr-2 h-4 w-4" aria-hidden={true} /> Explorar catálogo
        </Button>
      </div>
    </article>
  )
}
