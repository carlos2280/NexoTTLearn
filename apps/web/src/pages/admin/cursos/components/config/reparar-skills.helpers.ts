import type { RepararSkillsCursoPreview } from "@nexott-learn/shared-types"

/** `true` si reparar cambiaria algo (el aviso solo se muestra entonces). */
export function necesitaReparacion(p: RepararSkillsCursoPreview): boolean {
  return p.bloques > 0 || p.secciones > 0 || p.skillsExigidas > 0
}

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`
}

/** Lineas del resumen que se confirma antes de reparar. */
export function lineasResumenReparacion(p: RepararSkillsCursoPreview): readonly string[] {
  const lineas: string[] = []
  if (p.bloques > 0) {
    lineas.push(
      `${plural(p.bloques, "pregunta o reto recibe", "preguntas o retos reciben")} su habilidad (hoy no se pueden responder).`,
    )
  }
  if (p.secciones > 0) {
    lineas.push(`${plural(p.secciones, "sección entra", "secciones entran")} al plan de estudio.`)
  }
  if (p.skillsExigidas > 0) {
    lineas.push(fraseExigidas(p.skillsExigidas, p.areaExigida))
  }
  if (p.planes === 0) {
    lineas.push("No hay personas asignadas cuyo plan haya que recalcular.")
  } else if (p.planes === 1) {
    lineas.push("Se recalcula el plan de 1 persona asignada; recibe un aviso.")
  } else {
    lineas.push(`Se recalcula el plan de ${p.planes} personas asignadas; cada una recibe un aviso.`)
  }
  return lineas
}

function fraseExigidas(n: number, conArea: boolean): string {
  const sujeto = plural(n, "habilidad", "habilidades")
  if (conArea) {
    return `${sujeto} y el área del curso pasan a ser exigidas.`
  }
  return n === 1 ? `${sujeto} pasa a ser exigida.` : `${sujeto} pasan a ser exigidas.`
}
