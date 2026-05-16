interface CabeceraProps {
  readonly lenguaje: string
}

export function Cabecera({ lenguaje }: CabeceraProps) {
  return (
    <header className="flex flex-col gap-1">
      <span className="nx-eyebrow text-text-tertiary">Evaluable</span>
      <p className="text-body text-text-primary">Reto de código · {lenguaje}</p>
      <p className="text-body-sm text-text-tertiary">
        <em className="font-normal text-text-secondary not-italic">Ejecutar tests</em> corre en
        borrador (ensayar libre).{" "}
        <em className="font-normal text-text-secondary not-italic">Enviar intento</em> registra tu
        nota en el curso.
      </p>
    </header>
  )
}
