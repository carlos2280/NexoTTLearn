import type { CatalogoFichaArea } from "@nexott-learn/shared-types"
import { ChevronDown } from "lucide-react"

interface FichaContenidoProps {
  readonly areas: readonly CatalogoFichaArea[]
}

// §2.2 ficha-curso-libre.md · acordeon por area, primero abierto por defecto (F-03).
// Usamos <details>/<summary> nativos: accesibles, sin lib externa.
export function FichaContenido({ areas }: FichaContenidoProps) {
  if (areas.length === 0) {
    return null
  }
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-surface-1 p-6 md:p-8">
      <h2 className="font-semibold text-text-primary text-xl">Contenido del curso</h2>
      <div className="flex flex-col">
        {areas.map((area, idx) => (
          <AreaAcordeon key={area.areaId} area={area} abiertoPorDefecto={idx === 0} />
        ))}
      </div>
    </section>
  )
}

interface AreaAcordeonProps {
  readonly area: CatalogoFichaArea
  readonly abiertoPorDefecto: boolean
}

function AreaAcordeon({ area, abiertoPorDefecto }: AreaAcordeonProps) {
  return (
    <details
      open={abiertoPorDefecto}
      className="group/area border-glass-border border-b last:border-b-0"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: area.colorHex }}
          />
          <span className="font-semibold text-[15px] text-text-primary">{area.nombre}</span>
          <span className="text-[12px] text-text-muted">
            {area.modulos.length} {area.modulos.length === 1 ? "modulo" : "modulos"}
          </span>
        </div>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className="size-4 text-text-muted transition-transform duration-200 group-open/area:rotate-180"
        />
      </summary>
      <ul className="flex flex-col gap-1.5 pb-4 pl-5 text-[14px] text-text-secondary">
        {area.modulos.map((modulo) => (
          <li
            key={modulo.id}
            className="flex items-center justify-between gap-3 border-glass-border border-l py-2 pl-4"
          >
            <span className="flex flex-col">
              <span className="text-text-primary">{modulo.titulo}</span>
              <span className="text-[12px] text-text-muted">
                {modulo.cantidadSecciones}{" "}
                {modulo.cantidadSecciones === 1 ? "seccion" : "secciones"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}
