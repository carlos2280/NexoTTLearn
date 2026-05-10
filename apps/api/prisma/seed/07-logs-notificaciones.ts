/**
 * LogActividad (T02) y Notificacion (T06).
 *
 * Cubre:
 *   - LogActividad con causaId encadenado (T03 · I20):
 *     CURSO_PUBLICADO → RECALCULO_CURSO → RECALCULO_ETIQUETA.
 *   - Eventos representativos: bloque archivado, expediente sellado,
 *     pesos cambiados retroactivo, nota ajustada manual.
 *   - Notificacion: 1 ejemplo de cada uno de los 10 tipos (T06).
 */
import type { Prisma } from "@prisma/client"
import type { UsuariosSeedResult } from "./00-usuarios.js"
import type { CursoXyzSeedResult } from "./02-curso-xyz.js"
import type { CursoCerradoSeedResult } from "./04-curso-cerrado.js"
import { diasAtras, horasAtras, prisma, uuidEstable } from "./_lib.js"

export async function seedLogsYNotificaciones(
  usuarios: UsuariosSeedResult,
  cursoXyz: CursoXyzSeedResult,
  cursoCerrado: CursoCerradoSeedResult,
): Promise<void> {
  await crearLogsEncadenados(usuarios, cursoXyz, cursoCerrado)
  await crearNotificacionesDeCadaTipo(usuarios, cursoXyz)
  console.info("  ✓ Logs encadenados (causaId) + 10 notificaciones (todos los tipos T06)")
}

async function crearLogsEncadenados(
  usuarios: UsuariosSeedResult,
  cursoXyz: CursoXyzSeedResult,
  cursoCerrado: CursoCerradoSeedResult,
): Promise<void> {
  // 1. CURSO_PUBLICADO (raíz)
  await upsertLog({
    key: "publicar:xyz",
    actorId: usuarios.admin.id,
    tipoActor: "USUARIO",
    tipoAccion: "CURSO_PUBLICADO",
    entidadTipo: "Curso",
    entidadId: cursoXyz.cursoId,
    motivo: "Publicación inicial del curso para arranque con Empresa XYZ.",
    valorAntes: { estado: "BORRADOR" },
    valorDespues: { estado: "ACTIVO" },
    timestamp: diasAtras(20),
    causaId: null,
  })

  // 2. PESOS_CAMBIADOS_RETROACTIVO (efecto del admin tras feedback del cliente)
  const logPesos = await upsertLog({
    key: "pesos:xyz",
    actorId: usuarios.admin.id,
    tipoActor: "USUARIO",
    tipoAccion: "PESOS_CAMBIADOS_RETROACTIVO",
    entidadTipo: "Curso",
    entidadId: cursoXyz.cursoId,
    motivo: "Cliente solicitó subir peso de Backend del 25% al 30% tras revisión inicial.",
    valorAntes: { pesoBackend: 25 },
    valorDespues: { pesoBackend: 30 },
    timestamp: diasAtras(15),
    causaId: null,
  })

  // 3. RECALCULO_CURSO causado por el cambio de pesos (T03 · cadena)
  const logRecalcCurso = await upsertLog({
    key: "recalc_curso:xyz",
    actorId: null,
    tipoActor: "SISTEMA",
    tipoAccion: "RECALCULO_CURSO",
    entidadTipo: "Curso",
    entidadId: cursoXyz.cursoId,
    motivo: null,
    valorAntes: null,
    valorDespues: { recalculados: 3 },
    timestamp: diasAtras(15),
    causaId: logPesos.id,
  })

  // 4. RECALCULO_ETIQUETA encadenado (efecto del recálculo de curso)
  await upsertLog({
    key: "recalc_etiqueta:xyz",
    actorId: null,
    tipoActor: "SISTEMA",
    tipoAccion: "RECALCULO_ETIQUETA",
    entidadTipo: "Curso",
    entidadId: cursoXyz.cursoId,
    motivo: null,
    valorAntes: null,
    valorDespues: null,
    timestamp: diasAtras(15),
    causaId: logRecalcCurso.id,
  })

  // 5. EXPEDIENTE_SELLADO (Juan, curso Banco WW)
  await upsertLog({
    key: "exp_sellado:juan:bancoww",
    actorId: null,
    tipoActor: "SISTEMA",
    tipoAccion: "EXPEDIENTE_SELLADO",
    entidadTipo: "ExpedienteEntry",
    entidadId: cursoCerrado.expedienteJuan.id,
    motivo: null,
    valorAntes: null,
    valorDespues: { notaGlobal: 70, etiqueta: "APROBADO" },
    timestamp: diasAtras(178),
    causaId: null,
  })

  // 6. NOTA_AJUSTADA_MANUAL (admin sube nota de Juan en un quiz por feedback humano)
  await upsertLog({
    key: "nota_ajuste:juan:quiz_fe",
    actorId: usuarios.admin.id,
    tipoActor: "USUARIO",
    tipoAccion: "NOTA_AJUSTADA_MANUAL",
    entidadTipo: "EntregaBloque",
    entidadId: uuidEstable("entregaBloque:juan:quiz_fe:3"),
    motivo: "Pregunta 3 ambigua, validada manualmente como correcta.",
    valorAntes: { nota: 70 },
    valorDespues: { nota: 80 },
    timestamp: diasAtras(2),
    causaId: null,
  })

  // 7. INSCRIPCION_DESINSCRITA (Ana abandonada)
  await upsertLog({
    key: "inscr_abandono:ana",
    actorId: null,
    tipoActor: "SISTEMA",
    tipoAccion: "INSCRIPCION_DESINSCRITA",
    entidadTipo: "Inscripcion",
    entidadId: uuidEstable("inscripcion:ana:xyz"),
    motivo: "Participante abandonó voluntariamente el curso.",
    valorAntes: { estado: "ACTIVA" },
    valorDespues: { estado: "ABANDONADA" },
    timestamp: diasAtras(12),
    causaId: null,
  })

  // 8. AREA_OBSOLETADA (Adobe Flash legacy)
  await upsertLog({
    key: "area_obs:flash",
    actorId: usuarios.admin.id,
    tipoActor: "USUARIO",
    tipoAccion: "AREA_OBSOLETADA",
    entidadTipo: "Area",
    entidadId: uuidEstable("area:legacy_flash"),
    motivo: "Tecnología descontinuada por Adobe en 2020.",
    valorAntes: { estado: "ACTIVA" },
    valorDespues: { estado: "OBSOLETA" },
    timestamp: diasAtras(180),
    causaId: null,
  })
}

async function upsertLog(opts: {
  key: string
  actorId: string | null
  tipoActor: "USUARIO" | "SISTEMA"
  tipoAccion: import("@prisma/client").TipoAccionLog
  entidadTipo: string
  entidadId: string
  motivo: string | null
  valorAntes: Record<string, unknown> | null
  valorDespues: Record<string, unknown> | null
  timestamp: Date
  causaId: string | null
}): Promise<{ id: string }> {
  const id = uuidEstable(`log:${opts.key}`)
  await prisma.logActividad.upsert({
    where: { id },
    update: {},
    create: {
      id,
      actorId: opts.actorId,
      tipoActor: opts.tipoActor,
      tipoAccion: opts.tipoAccion,
      entidadTipo: opts.entidadTipo,
      entidadId: opts.entidadId,
      motivo: opts.motivo,
      valorAntes: (opts.valorAntes ?? undefined) as Prisma.InputJsonValue | undefined,
      valorDespues: (opts.valorDespues ?? undefined) as Prisma.InputJsonValue | undefined,
      timestamp: opts.timestamp,
      causaId: opts.causaId,
    },
  })
  return { id }
}

async function crearNotificacionesDeCadaTipo(
  usuarios: UsuariosSeedResult,
  cursoXyz: CursoXyzSeedResult,
): Promise<void> {
  type NotifSeed = {
    key: string
    tipo: import("@prisma/client").TipoNotificacion
    destinatarioId: string
    payload: Record<string, unknown>
    leida?: boolean
    haceHoras: number
  }

  const notifs: NotifSeed[] = [
    // Participante (6)
    {
      key: "modulo_asignado:juan",
      tipo: "MODULO_ASIGNADO",
      destinatarioId: usuarios.juan.id,
      payload: {
        titulo: "Te han asignado el módulo Backend",
        mensaje: "Backend (Python+PySpark+Pandas+APIs) — OBLIGATORIO.",
        deepLink: `/cursos/${cursoXyz.cursoId}/modulos/${cursoXyz.modulos.be_python.id}`,
      },
      leida: false,
      haceHoras: 18 * 24,
    },
    {
      key: "entrega_evaluada:juan",
      tipo: "ENTREGA_EVALUADA",
      destinatarioId: usuarios.juan.id,
      payload: {
        titulo: "Tu entrega fue evaluada",
        mensaje: "Obtuviste 75 en el ejercicio de Python avanzado.",
        deepLink: `/cursos/${cursoXyz.cursoId}/entregas`,
      },
      leida: true,
      haceHoras: 48,
    },
    {
      key: "proyecto_revisado:maria",
      tipo: "PROYECTO_REVISADO",
      destinatarioId: usuarios.maria.id,
      payload: {
        titulo: "Mini Proyecto evaluado",
        mensaje: "Tu Mini Proyecto Frontend obtuvo nota final 78.",
        deepLink: `/cursos/${cursoXyz.cursoId}/proyectos`,
      },
      leida: false,
      haceHoras: 24 * 4,
    },
    {
      key: "desbloqueo:pedro",
      tipo: "DESBLOQUEO",
      destinatarioId: usuarios.pedro.id,
      payload: {
        titulo: "Desbloqueaste el Proyecto Transversal",
        mensaje: "Cumples las condiciones para iniciar el Transversal.",
        deepLink: `/cursos/${cursoXyz.cursoId}/transversal`,
      },
      leida: false,
      haceHoras: 24 * 6,
    },
    {
      key: "recalculo_nota:juan",
      tipo: "RECALCULO_NOTA",
      destinatarioId: usuarios.juan.id,
      payload: {
        titulo: "Tu nota fue ajustada",
        mensaje: "Pregunta 3 del quiz Frontend recalculada.",
        deepLink: `/cursos/${cursoXyz.cursoId}/notas`,
      },
      leida: false,
      haceHoras: 48,
    },
    {
      key: "curso_completado:juan_bancoww",
      tipo: "CURSO_COMPLETADO",
      destinatarioId: usuarios.juan.id,
      payload: {
        titulo: "Curso completado: Backend Java · Banco WW",
        mensaje: "Nota global 70. Ver tu expediente.",
        deepLink: "/expediente",
      },
      leida: true,
      haceHoras: 178 * 24,
    },
    // Admin (4)
    {
      key: "nueva_entrega:admin:juan",
      tipo: "NUEVA_ENTREGA",
      destinatarioId: usuarios.admin.id,
      payload: {
        titulo: "Nueva entrega para revisar",
        mensaje: "Juan envió un ejercicio de Python.",
        deepLink: "/admin/entregas",
      },
      leida: false,
      haceHoras: 50,
    },
    {
      key: "nuevo_proyecto:admin:maria",
      tipo: "NUEVO_PROYECTO",
      destinatarioId: usuarios.admin.id,
      payload: {
        titulo: "Nuevo proyecto entregado",
        mensaje: "María envió Mini Proyecto Frontend (intento 1).",
        deepLink: "/admin/proyectos",
      },
      leida: true,
      haceHoras: 24 * 5,
    },
    {
      key: "alerta_plagio:admin",
      tipo: "ALERTA_PLAGIO",
      destinatarioId: usuarios.admin.id,
      payload: {
        titulo: "Alerta IA: alta similitud detectada",
        mensaje: "Pedro · Transversal intento 1 · severidad alta.",
        deepLink: "/admin/alertas",
      },
      leida: false,
      haceHoras: 24 * 5,
    },
    {
      key: "candidato_listo:admin:pedro",
      tipo: "CANDIDATO_LISTO",
      destinatarioId: usuarios.admin.id,
      payload: {
        titulo: "Candidato listo para reportar al cliente",
        mensaje: "Pedro Soto cumplió todas las condiciones del curso XYZ.",
        deepLink: "/admin/candidatos",
      },
      leida: false,
      haceHoras: 6,
    },
  ]

  for (const n of notifs) {
    const id = uuidEstable(`notif:${n.key}`)
    await prisma.notificacion.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tipo: n.tipo,
        destinatarioId: n.destinatarioId,
        payload: n.payload as Prisma.InputJsonValue,
        leida: n.leida ?? false,
        leidaAt: n.leida ? horasAtras(n.haceHoras - 1) : null,
        createdAt: horasAtras(n.haceHoras),
      },
    })
  }
}
