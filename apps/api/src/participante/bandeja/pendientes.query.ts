// Carga los bloques evaluables pendientes del participante. Un bloque es
// pendiente si NO tiene EntregaBloque con estado evaluada
// (EVALUADA / EVALUADA_AUTOMATICAMENTE) en ninguno de sus intentos.

import type { Prisma } from "@prisma/client"
import type { PrismaService } from "../../common/prisma/prisma.service"
import type { PendienteCrudo } from "./pendientes.types"

type InscripcionLite = Prisma.InscripcionGetPayload<{
  select: {
    id: true
    curso: { select: { id: true; titulo: true; empresaCliente: true; deadline: true } }
    asignaciones: { select: { moduloId: true } }
  }
}>

type ModuloLite = Prisma.ModuloGetPayload<{
  select: {
    id: true
    titulo: true
    secciones: {
      select: {
        id: true
        bloques: { select: { id: true; tipo: true; codigoEvaluable: true } }
      }
    }
  }
}>

type EntregaLite = { bloqueId: string; inscripcionId: string; estado: string }

export async function cargarPendientesCrudos(
  prisma: PrismaService,
  participanteId: string,
): Promise<PendienteCrudo[]> {
  const inscripciones = await prisma.inscripcion.findMany({
    where: { participanteId, estado: "ACTIVA" },
    select: {
      id: true,
      curso: { select: { id: true, titulo: true, empresaCliente: true, deadline: true } },
      asignaciones: { select: { moduloId: true } },
    },
  })
  if (inscripciones.length === 0) {
    return []
  }

  const moduloIds = Array.from(
    new Set(inscripciones.flatMap((i) => i.asignaciones.map((a) => a.moduloId))),
  )
  if (moduloIds.length === 0) {
    return []
  }

  const modulos = await prisma.modulo.findMany({
    where: { id: { in: moduloIds }, archivadoAt: null },
    select: {
      id: true,
      titulo: true,
      secciones: {
        where: { archivadoAt: null },
        select: {
          id: true,
          bloques: {
            where: {
              archivadoAt: null,
              // biome-ignore lint/style/useNamingConvention: clave OR es API de Prisma.
              OR: [
                { tipo: "QUIZ" },
                { tipo: "CODIGO", codigoEvaluable: { in: ["PREGUNTAS", "TESTS"] } },
              ],
            },
            select: { id: true, tipo: true, codigoEvaluable: true },
          },
        },
      },
    },
  })
  const moduloMap = new Map<string, ModuloLite>(modulos.map((m) => [m.id, m]))

  const bloqueIds = modulos.flatMap((m) => m.secciones.flatMap((s) => s.bloques.map((b) => b.id)))
  if (bloqueIds.length === 0) {
    return []
  }

  const entregas = await prisma.entregaBloque.findMany({
    where: { inscripcionId: { in: inscripciones.map((i) => i.id) }, bloqueId: { in: bloqueIds } },
    select: { bloqueId: true, inscripcionId: true, estado: true },
  })
  return aplanar(inscripciones, moduloMap, entregas)
}

interface ResumenEntregas {
  readonly intentos: Map<string, number>
  readonly aprobados: Set<string>
}

function resumirEntregas(entregasIns: EntregaLite[]): ResumenEntregas {
  const intentos = new Map<string, number>()
  const aprobados = new Set<string>()
  for (const e of entregasIns) {
    intentos.set(e.bloqueId, (intentos.get(e.bloqueId) ?? 0) + 1)
    if (e.estado === "EVALUADA" || e.estado === "EVALUADA_AUTOMATICAMENTE") {
      aprobados.add(e.bloqueId)
    }
  }
  return { intentos, aprobados }
}

function bloquesPendientes(modulo: ModuloLite, aprobados: Set<string>) {
  const out: { bloque: ModuloLite["secciones"][number]["bloques"][number]; seccionId: string }[] =
    []
  for (const s of modulo.secciones) {
    for (const b of s.bloques) {
      if (!aprobados.has(b.id)) {
        out.push({ bloque: b, seccionId: s.id })
      }
    }
  }
  return out
}

function aplanar(
  inscripciones: InscripcionLite[],
  moduloMap: Map<string, ModuloLite>,
  entregas: EntregaLite[],
): PendienteCrudo[] {
  const out: PendienteCrudo[] = []
  for (const ins of inscripciones) {
    const resumen = resumirEntregas(entregas.filter((e) => e.inscripcionId === ins.id))
    for (const a of ins.asignaciones) {
      const m = moduloMap.get(a.moduloId)
      if (!m) {
        continue
      }
      for (const { bloque: b, seccionId } of bloquesPendientes(m, resumen.aprobados)) {
        out.push({
          bloqueId: b.id,
          seccionId,
          moduloId: m.id,
          inscripcionId: ins.id,
          cursoId: ins.curso.id,
          tipoBloque: b.tipo,
          codigoEvaluable: b.codigoEvaluable,
          tituloModulo: m.titulo,
          tituloCurso: ins.curso.titulo,
          empresaCliente: ins.curso.empresaCliente,
          cursoDeadline: ins.curso.deadline,
          intentosPrevios: resumen.intentos.get(b.id) ?? 0,
        })
      }
    }
  }
  return out
}
