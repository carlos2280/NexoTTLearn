import type { EventoPulso, TipoEvento } from "@/pages/admin/inicio/inicio.types"
import type { AccionAuditoriaLiteral, AuditoriaResumen } from "@nexott-learn/shared-types"

const MS_POR_MIN = 60 * 1000
const MS_POR_HORA = 60 * MS_POR_MIN
const MS_POR_DIA = 24 * MS_POR_HORA

const TIPO_POR_ACCION = new Map<AccionAuditoriaLiteral, TipoEvento>([
  // publicacion — creación de contenido
  ["MODULO_CREADO", "publicacion"],
  ["SECCION_CREADA", "publicacion"],
  ["BLOQUE_CREADO", "publicacion"],
  ["SKILL_CREADA", "publicacion"],
  ["AREA_CREADA", "publicacion"],
  ["CLIENTE_CREADO", "publicacion"],
  ["CURSO_CIERRE_DESHECHO", "publicacion"],
  // matricula — personas / inscripciones
  ["COLABORADOR_CREADO", "matricula"],
  ["ASIGNACION_CREADA", "matricula"],
  ["ASIGNACION_CONVERTIDA", "matricula"],
  ["ASIGNACION_INICIADA", "matricula"],
  ["VOLUNTARIO_AUTOINSCRITO", "matricula"],
  ["NOTA_SKILL_EDITADA_MANUALMENTE", "matricula"],
  // evaluacion — cierres / resultados
  ["EVALUACION_APLICADA", "evaluacion"],
  ["INTENTO_TRANSVERSAL_FINALIZADO", "evaluacion"],
  ["INTENTO_ENTREVISTA_IA_FINALIZADO", "evaluacion"],
  ["ASIGNACION_LISTA", "evaluacion"],
  ["ASIGNACION_CERRADA", "evaluacion"],
  ["CURSO_CERRADO", "evaluacion"],
  ["RESULTADO_ENTREVISTA_CLIENTE_REGISTRADO", "evaluacion"],
  ["PLAN_RECALCULADO", "evaluacion"],
  // alerta — fallos / acciones destructivas
  ["LOGIN_FAIL", "alerta"],
  ["MFA_VERIFY_FAIL", "alerta"],
  ["INTENTO_BLOQUE_INVALIDADO", "alerta"],
  ["INTENTO_TRANSVERSAL_ANULADO", "alerta"],
  ["INTENTO_ENTREVISTA_IA_ANULADO", "alerta"],
  ["MODULO_ELIMINADO", "alerta"],
  ["BLOQUE_ELIMINADO_SOFT", "alerta"],
  ["SKILL_ELIMINADA", "alerta"],
  ["AREA_ELIMINADA", "alerta"],
  ["CLIENTE_ELIMINADO", "alerta"],
  ["ASIGNACION_RETIRADA", "alerta"],
  ["ASIGNACION_REABIERTA", "alerta"],
  ["MODULO_HUERFANO_DETECTADO", "alerta"],
])

const VERBO_POR_ACCION = new Map<AccionAuditoriaLiteral, string>([
  ["MODULO_CREADO", "creó el módulo"],
  ["SECCION_CREADA", "creó una sección"],
  ["BLOQUE_CREADO", "creó un bloque"],
  ["SKILL_CREADA", "creó la skill"],
  ["AREA_CREADA", "creó el área"],
  ["CLIENTE_CREADO", "dio de alta al cliente"],
  ["CURSO_CIERRE_DESHECHO", "deshizo el cierre del curso"],
  ["COLABORADOR_CREADO", "dio de alta a un colaborador"],
  ["ASIGNACION_CREADA", "asignó un curso"],
  ["ASIGNACION_CONVERTIDA", "convirtió una asignación"],
  ["ASIGNACION_INICIADA", "inició una asignación"],
  ["VOLUNTARIO_AUTOINSCRITO", "se autoinscribió"],
  ["NOTA_SKILL_EDITADA_MANUALMENTE", "editó una nota de skill"],
  ["EVALUACION_APLICADA", "aplicó la evaluación inicial"],
  ["INTENTO_TRANSVERSAL_FINALIZADO", "cerró un intento transversal"],
  ["INTENTO_ENTREVISTA_IA_FINALIZADO", "cerró una entrevista IA"],
  ["ASIGNACION_LISTA", "marcó una asignación como lista"],
  ["ASIGNACION_CERRADA", "cerró una asignación"],
  ["CURSO_CERRADO", "cerró el curso"],
  ["RESULTADO_ENTREVISTA_CLIENTE_REGISTRADO", "registró el resultado con cliente"],
  ["PLAN_RECALCULADO", "recalculó un plan personal"],
  ["LOGIN_OK", "inició sesión"],
  ["LOGOUT", "cerró sesión"],
  ["LOGIN_FAIL", "falló al iniciar sesión"],
  ["MFA_VERIFY_FAIL", "falló la verificación MFA"],
  ["INTENTO_BLOQUE_INVALIDADO", "invalidó un intento de bloque"],
  ["INTENTO_TRANSVERSAL_ANULADO", "anuló un intento transversal"],
  ["INTENTO_ENTREVISTA_IA_ANULADO", "anuló una entrevista IA"],
  ["MODULO_ELIMINADO", "eliminó un módulo"],
  ["BLOQUE_ELIMINADO_SOFT", "eliminó un bloque"],
  ["SKILL_ELIMINADA", "eliminó una skill"],
  ["AREA_ELIMINADA", "eliminó un área"],
  ["CLIENTE_ELIMINADO", "eliminó un cliente"],
  ["ASIGNACION_RETIRADA", "retiró una asignación"],
  ["ASIGNACION_REABIERTA", "reabrió una asignación"],
  ["MODULO_HUERFANO_DETECTADO", "detectó un módulo huérfano"],
])

function clasificar(accion: AccionAuditoriaLiteral, exito: boolean): TipoEvento {
  if (!exito) {
    return "alerta"
  }
  return TIPO_POR_ACCION.get(accion) ?? "sistema"
}

function textoAccion(accion: AccionAuditoriaLiteral): string {
  return VERBO_POR_ACCION.get(accion) ?? "ejecutó una acción"
}

function textoObjeto(entrada: AuditoriaResumen): string {
  if (entrada.recursoTipo && entrada.recursoId) {
    return `${entrada.recursoTipo} ${entrada.recursoId.slice(0, 8)}`
  }
  if (entrada.recursoTipo) {
    return entrada.recursoTipo
  }
  return ""
}

function textoActor(entrada: AuditoriaResumen): string {
  return entrada.actorNombre ?? entrada.actorEmail ?? "Sistema"
}

export function calcularHace(fechaIso: string): string {
  const diff = Date.now() - new Date(fechaIso).getTime()
  if (diff < MS_POR_MIN) {
    return "ahora"
  }
  if (diff < MS_POR_HORA) {
    return `hace ${Math.floor(diff / MS_POR_MIN)} min`
  }
  if (diff < MS_POR_DIA) {
    return `hace ${Math.floor(diff / MS_POR_HORA)} h`
  }
  return `hace ${Math.floor(diff / MS_POR_DIA)} d`
}

export function construirEventosPulso(
  entradas: readonly AuditoriaResumen[],
): readonly EventoPulso[] {
  return entradas.map((entrada) => ({
    id: entrada.id,
    tipo: clasificar(entrada.accion, entrada.exito),
    actor: textoActor(entrada),
    accion: textoAccion(entrada.accion),
    objeto: textoObjeto(entrada),
    hace: calcularHace(entrada.createdAt),
  }))
}
