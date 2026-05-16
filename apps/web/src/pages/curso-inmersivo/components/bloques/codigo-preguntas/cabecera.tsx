interface CabeceraProps {
  readonly lenguaje: string
}

export function Cabecera({ lenguaje }: CabeceraProps) {
  return (
    <header className="flex flex-col gap-1">
      <span className="nx-eyebrow text-text-tertiary">Evaluable</span>
      <p className="text-body text-text-primary">Reto de código · {lenguaje}</p>
    </header>
  )
}
