interface CabeceraQuizProps {
  readonly totalPreguntas: number
}

export function CabeceraQuiz({ totalPreguntas }: CabeceraQuizProps) {
  return (
    <header className="flex flex-col gap-1">
      <span className="nx-eyebrow text-text-tertiary">Evaluable</span>
      <p className="text-body text-text-primary">
        Quiz · {totalPreguntas} pregunta{totalPreguntas === 1 ? "" : "s"}
      </p>
    </header>
  )
}
