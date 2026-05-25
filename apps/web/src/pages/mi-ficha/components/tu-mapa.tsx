import { slugArea } from "@/shared/lib/slug-area"
import type { FichaPorAreaItem, NivelCualitativoArea } from "@nexott-learn/shared-types"

interface TuMapaProps {
  readonly porArea: readonly FichaPorAreaItem[]
}

const ORDEN_AREAS = [
  "frontend",
  "backend",
  "cloud",
  "data",
  "mobile",
  "devops",
  "qa",
  "soft",
] as const

const ETIQUETA_NIVEL: Record<NivelCualitativoArea, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  inicial: "Inicial",
  sinTocar: "Por explorar",
}

// 5 dots fijos por area: 5/4/3/2/0 segun nivel.
const DOTS_LLENOS: Record<NivelCualitativoArea, number> = {
  excelencia: 5,
  solido: 4,
  enDesarrollo: 3,
  inicial: 2,
  sinTocar: 0,
}

const TOTAL_DOTS = 5

/**
 * "Donde estas hoy" — snapshot del estado actual del colaborador por area.
 * Lista editorial densa (sin cards) que enfatiza tipografia y datos antes
 * que contenedores: una fila por area activa con dot del color, nombre, 5
 * dots de progreso, etiqueta de nivel y conteo de habilidades. Las areas
 * sin tocar se resumen en una sola linea al pie.
 */
export function TuMapa({ porArea }: TuMapaProps) {
  const ordenado = [...porArea].sort((a, b) => {
    const ia = ORDEN_AREAS.indexOf(slugArea(a.nombre))
    const ib = ORDEN_AREAS.indexOf(slugArea(b.nombre))
    if (ia !== ib) {
      return ia - ib
    }
    return a.nombre.localeCompare(b.nombre, "es")
  })
  const activas = ordenado.filter((a) => a.nivelCualitativo !== "sinTocar")
  const porExplorar = ordenado.filter((a) => a.nivelCualitativo === "sinTocar")

  return (
    <section className="flex flex-col gap-5" aria-labelledby="tu-mapa-titulo">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Tu mapa</span>
        <h2 id="tu-mapa-titulo" className="text-h2 text-text-primary">
          Donde estas hoy
        </h2>
      </header>

      {activas.length > 0 ? (
        <ul className="flex flex-col">
          {activas.map((area) => (
            <FilaArea key={area.areaId} area={area} />
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-text-secondary">
          Aun no tienes habilidades demostradas. Tu camino comienza con el primer curso.
        </p>
      )}

      {porExplorar.length > 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Otras areas aun esperan:{" "}
          <span className="text-text-secondary">{porExplorar.map((a) => a.nombre).join(", ")}</span>
          .
        </p>
      ) : null}
    </section>
  )
}

interface FilaAreaProps {
  readonly area: FichaPorAreaItem
}

function FilaArea({ area }: FilaAreaProps) {
  const slug = slugArea(area.nombre)
  const nivel = area.nivelCualitativo
  const llenos = DOTS_LLENOS[nivel]
  const colorArea = `var(--color-area-${slug})`
  const conteo = `${area.skillsConNota} ${area.skillsConNota === 1 ? "hab." : "hab."}`

  return (
    <li className="grid grid-cols-[12px_1fr_96px_56px] items-center gap-4 border-border border-b py-3 last:border-b-0 sm:grid-cols-[12px_1fr_72px_96px_56px] sm:gap-6">
      <span
        aria-hidden="true"
        className="block h-2 w-2 shrink-0 rounded-full"
        style={{ background: colorArea }}
      />
      <span className="truncate text-body text-text-primary">{area.nombre}</span>
      <span aria-hidden="true" className="hidden items-center gap-1.5 sm:flex">
        {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
          const lleno = i < llenos
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: lista fija de 5 dots, el indice ES la identidad
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                background: lleno ? colorArea : "transparent",
                border: lleno ? "none" : "1px solid var(--color-border-strong)",
              }}
            />
          )
        })}
      </span>
      <span className="text-body-sm text-text-secondary">{ETIQUETA_NIVEL[nivel]}</span>
      <span className="tabular text-right text-caption text-text-tertiary">{conteo}</span>
    </li>
  )
}
