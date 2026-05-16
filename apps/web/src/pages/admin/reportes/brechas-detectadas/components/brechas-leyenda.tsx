import { NIVELES } from "../brechas-detectadas.types"

export function BrechasLeyenda() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {NIVELES.map((n) => (
        <li key={n.id} className="inline-flex items-center gap-2">
          <span
            aria-hidden={true}
            className="h-2 w-2 rounded-pill"
            style={{ background: n.tokenColor }}
          />
          <span className="text-caption text-text-secondary">{n.etiqueta}</span>
        </li>
      ))}
    </ul>
  )
}
