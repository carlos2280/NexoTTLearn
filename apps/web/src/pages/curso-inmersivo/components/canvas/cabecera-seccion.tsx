import type { ModoCursoParticipante } from "@nexott-learn/shared-types"
import type { SeccionActiva } from "../../hooks/use-seccion-activa"

interface CabeceraSeccionProps {
  readonly seccion: SeccionActiva
  readonly modo: ModoCursoParticipante
}

export function CabeceraSeccion({ seccion, modo }: CabeceraSeccionProps) {
  return (
    <header className="flex flex-col gap-2">
      <span className="nx-eyebrow text-aurora-violet">{eyebrowDeSeccion(seccion, modo)}</span>
      <h2 className="text-display-md text-text-primary leading-tight">{seccion.titulo}</h2>
      <p className="text-body-sm text-text-tertiary">{copySubtitulo(seccion, modo)}</p>
    </header>
  )
}

function eyebrowDeSeccion(seccion: SeccionActiva, modo: ModoCursoParticipante): string {
  if (modo === "preview") {
    return "Vista previa"
  }
  if (seccion.caracter === "OPCIONAL") {
    return "Sección opcional"
  }
  return "Sección"
}

function copySubtitulo(seccion: SeccionActiva, modo: ModoCursoParticipante): string {
  if (modo === "preview") {
    return "Inscríbete como voluntario para responder los bloques evaluables y guardar tu progreso."
  }
  if (seccion.completada) {
    return "Ya completaste esta sección. Puedes repasarla cuando quieras."
  }
  if (seccion.avance && seccion.avance.bloquesTotales > 0) {
    return `${seccion.avance.bloquesCompletados} de ${seccion.avance.bloquesTotales} bloques evaluables completados.`
  }
  return "Sección de lectura — se marca como completada al abrirla."
}
