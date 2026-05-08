// Carga las inscripciones del participante con todos los datos necesarios
// para la lista `/cursos`. Incluye:
//   - inscripcion + curso + asignaciones (modulo + orden + titulo)
//   - estados de cada modulo asignado (porcentaje)
//   - cantidad de modulos no archivados del curso (denominador del card)
//   - nota global desde ExpedienteEntry para inscripciones COMPLETADA
//
// Excluye inscripciones CERRADO_SIN_COMPLETAR del listado base (decision §6.4
// del README de la seccion: ese estado vive en /expediente, no en /cursos).
// Se conservan en el conteo de "completados" porque son terminales.
//
// Las inscripciones ABANDONADA solo se incluyen si son LIBRE (§4.5.3).

import type { PrismaService } from "../../common/prisma/prisma.service"
import type { InscripcionRow } from "./mis-cursos.types"

export async function cargarInscripcionesDelParticipante(
  prisma: PrismaService,
  participanteId: string,
): Promise<InscripcionRow[]> {
  const inscripciones = await prisma.inscripcion.findMany({
    where: { participanteId },
    select: {
      id: true,
      tipo: true,
      estado: true,
      inscritaAt: true,
      completadaAt: true,
      abandonadaAt: true,
      cerradaSinCompletarAt: true,
      curso: {
        select: {
          id: true,
          slug: true,
          titulo: true,
          descripcion: true,
          empresaCliente: true,
          modulos: { where: { archivadoAt: null }, select: { id: true } },
        },
      },
      asignaciones: { select: { moduloId: true, tipo: true } },
      estadosModulo: { select: { moduloId: true, estado: true, porcentajeAvance: true } },
    },
    orderBy: { inscritaAt: "desc" },
  })

  if (inscripciones.length === 0) {
    return []
  }

  // Cargar titulo + orden de los modulos asignados (la asignacion es FK suave).
  const moduloIds = new Set<string>()
  for (const ins of inscripciones) {
    for (const a of ins.asignaciones) {
      moduloIds.add(a.moduloId)
    }
  }
  const modulosInfo =
    moduloIds.size === 0
      ? []
      : await prisma.modulo.findMany({
          where: { id: { in: Array.from(moduloIds) }, archivadoAt: null },
          select: { id: true, titulo: true, orden: true },
        })
  const moduloMap = new Map(modulosInfo.map((m) => [m.id, m]))

  // Notas globales del expediente para inscripciones COMPLETADA.
  const cursoIds = inscripciones.filter((i) => i.estado === "COMPLETADA").map((i) => i.curso.id)
  const expedientes =
    cursoIds.length === 0
      ? []
      : await prisma.expedienteEntry.findMany({
          where: { participanteId, cursoId: { in: cursoIds } },
          select: { cursoId: true, notaGlobal: true },
        })
  const notaPorCurso = new Map(expedientes.map((e) => [e.cursoId, Number(e.notaGlobal)]))

  return inscripciones.map((ins) => {
    const asignacionesEnriquecidas = ins.asignaciones.flatMap((a) => {
      const info = moduloMap.get(a.moduloId)
      if (!info) {
        return []
      }
      return [
        {
          moduloId: a.moduloId,
          tipo: a.tipo,
          orden: info.orden,
          tituloModulo: info.titulo,
        },
      ]
    })

    return {
      id: ins.id,
      tipo: ins.tipo,
      estado: ins.estado,
      inscritaAt: ins.inscritaAt,
      completadaAt: ins.completadaAt,
      abandonadaAt: ins.abandonadaAt,
      cerradaSinCompletarAt: ins.cerradaSinCompletarAt,
      curso: {
        id: ins.curso.id,
        slug: ins.curso.slug,
        titulo: ins.curso.titulo,
        descripcion: ins.curso.descripcion,
        empresaCliente: ins.curso.empresaCliente,
      },
      cantidadModulos: ins.curso.modulos.length,
      asignaciones: asignacionesEnriquecidas,
      estadosModulo: ins.estadosModulo,
      notaGlobal: notaPorCurso.get(ins.curso.id) ?? null,
    }
  })
}
