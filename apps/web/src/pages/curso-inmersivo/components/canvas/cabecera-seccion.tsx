import { IlustracionModulo } from "@/shared/components/ilustracion-modulo"
import type { ModoCursoParticipante } from "@nexott-learn/shared-types"
import type { SeccionActiva } from "../../hooks/use-seccion-activa"

interface CabeceraSeccionProps {
  readonly seccion: SeccionActiva
  readonly modo: ModoCursoParticipante
}

export function CabeceraSeccion({ seccion, modo }: CabeceraSeccionProps) {
  const partes = partesEyebrow(seccion, modo)
  return (
    <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-5">
      <IlustracionModulo
        tituloModulo={seccion.moduloTitulo}
        className="h-16 w-16 shrink-0 sm:mt-1.5"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <span className="nx-eyebrow text-text-secondary">
          <span>{partes.prefijo}</span>
          <span className="text-aurora-violet">{partes.modulo}</span>
          {partes.sufijo ? <span className="text-text-tertiary"> · {partes.sufijo}</span> : null}
        </span>
        <h2 className="text-display-md text-text-primary leading-tight">{seccion.titulo}</h2>
        <p className="text-body text-text-secondary">{copySubtitulo(seccion, modo)}</p>
      </div>
    </header>
  )
}

interface PartesEyebrow {
  readonly prefijo: string
  readonly modulo: string
  readonly sufijo: string | null
}

function partesEyebrow(seccion: SeccionActiva, modo: ModoCursoParticipante): PartesEyebrow {
  const prefijo = `Módulo ${seccion.moduloOrden} · `
  const modulo = seccion.moduloTitulo
  if (modo === "preview") {
    return { prefijo, modulo, sufijo: "Vista previa" }
  }
  if (seccion.caracter === "OPCIONAL") {
    return { prefijo, modulo, sufijo: "Opcional" }
  }
  return { prefijo, modulo, sufijo: null }
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
