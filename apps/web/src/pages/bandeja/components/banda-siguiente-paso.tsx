import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import type { MeCursoResumen } from "@nexott-learn/shared-types"
import { ArrowRight, Compass } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface BandaSiguientePasoProps {
  readonly cursoSugerido: MeCursoResumen | null
  readonly nombreUsuario: string
  readonly saludo: string
}

/**
 * Banda cumbre de la bandeja (doc 02_mi_bandeja §4). Hoy implementamos sólo
 * dos casos del §4.2: si hay curso activo, "continuar"; si no, empty A (sin
 * asignaciones). Los casos 1-6 (reapertura, transversal disponible, etc.)
 * requieren GET /me/bandeja del backend — pendiente.
 */
export function BandaSiguientePaso({
  cursoSugerido,
  nombreUsuario,
  saludo,
}: BandaSiguientePasoProps) {
  const navigate = useNavigate()
  const titulo = `${saludo}, ${nombreUsuario}.`

  if (!cursoSugerido) {
    return (
      <section aria-labelledby="siguiente-paso-titulo" className="flex flex-col gap-4">
        <h1 id="siguiente-paso-titulo" className="text-h2 text-text-primary">
          {titulo}
        </h1>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
          <p className="nx-eyebrow text-aurora-violet">Aún no tienes cursos asignados</p>
          <p className="text-body text-text-secondary">
            Cuando el administrador te asigne a un curso, lo verás aquí. Mientras tanto, puedes
            inscribirte por tu cuenta a cualquiera de los cursos abiertos.
          </p>
          <div className="mt-2">
            <Button onClick={() => navigate(RUTAS.participante.catalogo)}>
              <Compass className="mr-2 h-4 w-4" aria-hidden={true} /> Explorar catálogo
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="siguiente-paso-titulo" className="flex flex-col gap-4">
      <h1 id="siguiente-paso-titulo" className="text-h2 text-text-primary">
        {titulo}
      </h1>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
        <p className="nx-eyebrow text-aurora-violet">Tu siguiente paso</p>
        <h2 className="text-h3 text-text-primary">{cursoSugerido.cursoTitulo}</h2>
        <p className="text-body-sm text-text-secondary">
          Continúa desde donde lo dejaste. Llevas {cursoSugerido.porcentajeAvance}% de avance.
        </p>
        <div className="mt-2">
          <Button onClick={() => navigate(RUTAS.participante.cursoDetalle(cursoSugerido.cursoId))}>
            Continuar <ArrowRight className="ml-2 h-4 w-4" aria-hidden={true} />
          </Button>
        </div>
        <p className="text-caption text-text-tertiary">
          Por qué aquí: es el curso activo con deadline más cercano.
        </p>
      </div>
    </section>
  )
}
