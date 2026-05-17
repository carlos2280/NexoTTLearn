import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { MeCursoResumen } from "@nexott-learn/shared-types"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ordenarCursosActivos } from "../lib/orden-cursos"
import { CardCursoBandeja } from "./card-curso-bandeja"

interface BandaCursosActivosProps {
  readonly cursos: readonly MeCursoResumen[]
}

/**
 * Bloque 2 de la bandeja — "Mis cursos activos".
 *
 * Tres layouts según volumen:
 *  - 1 curso  → card destacada (ancho generoso, capacidades pendientes).
 *  - 2-4      → grilla 2 columnas, cards compactas.
 *  - 5+       → grilla 3 columnas, cards compactas + link "ver todos".
 *
 * Las "pendientes con deadline cercano" NO son banda aparte — el tono del
 * deadline (warmth / danger) vive ya en la card (refinamiento doc 01).
 */
export function BandaCursosActivos({ cursos }: BandaCursosActivosProps) {
  const navigate = useNavigate()
  if (cursos.length === 0) {
    return null
  }
  const ordenados = ordenarCursosActivos(cursos)
  const total = ordenados.length

  return (
    <section aria-labelledby="cursos-activos-titulo" className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <h2 id="cursos-activos-titulo" className="text-h3 text-text-primary">
          Mis cursos activos
        </h2>
        {total >= 5 ? (
          <Button variant="ghost" size="sm" onClick={() => navigate(RUTAS.participante.misCursos)}>
            Ver todos <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden={true} />
          </Button>
        ) : null}
      </header>
      <Grilla cursos={ordenados} />
    </section>
  )
}

function Grilla({ cursos }: { readonly cursos: readonly MeCursoResumen[] }) {
  const total = cursos.length
  if (total === 1) {
    const curso = cursos[0]
    if (!curso) {
      return null
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CardCursoBandeja curso={curso} variante="destacada" />
      </div>
    )
  }
  const columnas = total <= 4 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
  return (
    <div className={cn("grid grid-cols-1 gap-4", columnas)}>
      {cursos.map((curso) => (
        <CardCursoBandeja key={curso.asignacionId} curso={curso} variante="compacta" />
      ))}
    </div>
  )
}
