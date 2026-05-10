interface FichaSobreCursoProps {
  readonly descripcionLarga: string | null
  readonly objetivos: readonly string[] | null
}

// §2.1 ficha-curso-libre.md · "Sobre este curso" — descripcion larga + objetivos.
// Si no hay descripcion ni objetivos, no renderizamos la seccion.
export function FichaSobreCurso({ descripcionLarga, objetivos }: FichaSobreCursoProps) {
  const hayDescripcion = descripcionLarga !== null && descripcionLarga.trim().length > 0
  const hayObjetivos = objetivos !== null && objetivos.length > 0
  if (!(hayDescripcion || hayObjetivos)) {
    return null
  }
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-surface-1 p-6 md:p-8">
      <h2 className="font-semibold text-text-primary text-xl">Sobre este curso</h2>
      {hayDescripcion ? (
        <p className="whitespace-pre-line text-[14.5px] text-text-secondary leading-relaxed">
          {descripcionLarga}
        </p>
      ) : null}
      {hayObjetivos ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium text-[13px] text-text-muted uppercase tracking-[0.08em]">
            Objetivos de aprendizaje
          </h3>
          <ul className="flex flex-col gap-1.5 text-[14px] text-text-secondary leading-relaxed">
            {objetivos.map((obj) => (
              <li key={obj} className="flex gap-2">
                <span aria-hidden="true" className="text-brand-violet-soft">
                  ·
                </span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
