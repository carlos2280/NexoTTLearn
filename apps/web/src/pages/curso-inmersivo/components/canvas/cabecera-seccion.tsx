import type { ModoCursoParticipante } from "@nexott-learn/shared-types"
import type { SeccionActiva } from "../../hooks/use-seccion-activa"

interface CabeceraSeccionProps {
  readonly seccion: SeccionActiva
  readonly modo: ModoCursoParticipante
}

/**
 * Cabecera de sección en lenguaje "archivo abierto": un breadcrumb mono con la
 * ruta lógica (módulo, y `preview`/`opcional` si aplica) y el título como
 * heading markdown (`#`). Sin ilustración ni display gigante — el nombre de la
 * sección ya vive en el tab-strip y en el sidebar; aquí basta con "abrir el
 * archivo". El subtítulo se lee como comentario (`//`), coherente con los
 * subtítulos del cuerpo.
 */
export function CabeceraSeccion({ seccion, modo }: CabeceraSeccionProps) {
  const sufijo = sufijoRuta(seccion, modo)
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-2 font-code text-caption text-text-tertiary">
        <span className="truncate">
          Módulo {seccion.moduloOrden} · {seccion.moduloTitulo}
        </span>
        {sufijo ? (
          <>
            <span aria-hidden={true} className="text-text-disabled">
              /
            </span>
            <span className="text-text-secondary">{sufijo}</span>
          </>
        ) : null}
      </div>
      <h2 className="flex items-baseline gap-2.5 leading-tight">
        <span aria-hidden={true} className="font-code text-accent text-h3">
          #
        </span>
        <span className="text-h1 text-text-primary">{seccion.titulo}</span>
      </h2>
      <p className="font-code text-[color:var(--color-syntax-comment)] text-body-sm italic">
        <span aria-hidden={true}>{"// "}</span>
        {copySubtitulo(seccion, modo)}
      </p>
    </header>
  )
}

function sufijoRuta(seccion: SeccionActiva, modo: ModoCursoParticipante): string | null {
  if (modo === "preview") {
    return "preview"
  }
  if (seccion.caracter === "OPCIONAL") {
    return "opcional"
  }
  return null
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
