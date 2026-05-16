import type { ModoCursoParticipante } from "@nexott-learn/shared-types"
import type { SeccionActiva } from "../../hooks/use-seccion-activa"

interface CabeceraSeccionProps {
  readonly seccion: SeccionActiva
  readonly modo: ModoCursoParticipante
}

export function CabeceraSeccion({ seccion, modo }: CabeceraSeccionProps) {
  return (
    <header className="flex flex-col gap-2">
      <span className="nx-eyebrow text-text-tertiary">{eyebrowDeSeccion(seccion, modo)}</span>
      <h2 className="text-display-md text-text-primary leading-tight">{seccion.titulo}</h2>
      <p className="text-body-sm text-text-tertiary">{copySubtitulo(seccion, modo)}</p>
    </header>
  )
}

function eyebrowDeSeccion(seccion: SeccionActiva, modo: ModoCursoParticipante): string {
  const base = `Módulo ${seccion.moduloOrden} · ${seccion.moduloTitulo}`
  if (modo === "preview") {
    return `${base} · Vista previa`
  }
  if (seccion.caracter === "OPCIONAL") {
    return `${base} · Opcional`
  }
  return base
}

function copySubtitulo(seccion: SeccionActiva, modo: ModoCursoParticipante): string {
  if (modo === "preview") {
    return "Inscríbete como voluntario para responder los bloques evaluables y guardar tu progreso."
  }
  if (seccion.completada) {
    return "Ya completaste esta sección. Puedes repasarla cuando quieras."
  }
  const evaluables = seccion.avance?.bloquesTotales ?? 0
  if (evaluables > 0) {
    return `Esta sección tiene ${evaluables} ${evaluables === 1 ? "bloque evaluable" : "bloques evaluables"}.`
  }
  return "Sección de lectura — se marca como completada al abrirla."
}
