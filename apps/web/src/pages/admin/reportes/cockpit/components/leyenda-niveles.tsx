const NIVELES: ReadonlyArray<{
  readonly key: string
  readonly etiqueta: string
  readonly color: string
}> = [
  {
    key: "excelencia",
    etiqueta: "Excelencia (≥85)",
    color: "rgb(var(--color-success-rgb) / 0.85)",
  },
  { key: "solido", etiqueta: "Sólido (70-84)", color: "rgb(var(--color-success-rgb) / 0.5)" },
  {
    key: "enDesarrollo",
    etiqueta: "En desarrollo (50-69)",
    color: "rgb(var(--color-warning-rgb) / 0.55)",
  },
  { key: "inicial", etiqueta: "Inicial (<50)", color: "rgb(var(--color-danger-rgb) / 0.6)" },
  { key: "sinTocar", etiqueta: "Sin evaluar", color: "var(--color-muted)" },
]

export function LeyendaNiveles() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-text-secondary">
      {NIVELES.map((n) => (
        <li key={n.key} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-4 rounded-sm"
            style={{ background: n.color }}
            aria-hidden={true}
          />
          {n.etiqueta}
        </li>
      ))}
    </ul>
  )
}
