// Carga la ficha de un curso libre por slug, junto con:
//   - descripcion + descripcion larga
//   - areas con sus modulos (acordeon §2.2 ficha-curso-libre.md)
//   - flags de hitos derivados de pesos del curso
//   - flag yaInscritoActivo segun el participante
//
// Devuelve null si:
//   - el curso no existe;
//   - el curso no tiene permiteInscripcionLibre = true;
//   - el curso no esta ACTIVO.

import type { PrismaService } from "../../common/prisma/prisma.service"
import type { CursoFichaRow } from "./catalogo.types"

export async function cargarFicha(
  prisma: PrismaService,
  participanteId: string,
  slug: string,
): Promise<CursoFichaRow | null> {
  const curso = await prisma.curso.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      titulo: true,
      descripcion: true,
      empresaCliente: true,
      duracionEstimada: true,
      estado: true,
      permiteInscripcionLibre: true,
      pesoProyectoTransversal: true,
      pesoEntrevistaIA: true,
      cursoAreas: {
        select: {
          orden: true,
          area: { select: { id: true, nombre: true, color: true } },
        },
        orderBy: { orden: "asc" },
      },
      modulos: {
        where: { archivadoAt: null },
        select: {
          id: true,
          titulo: true,
          orden: true,
          areaId: true,
          secciones: {
            where: { archivadoAt: null },
            select: { id: true },
          },
        },
        orderBy: { orden: "asc" },
      },
    },
  })

  if (!curso) {
    return null
  }
  if (!curso.permiteInscripcionLibre || curso.estado !== "ACTIVO") {
    return null
  }

  // Agrupar modulos por area, respetando el orden de CursoArea.
  const modulosPorArea = new Map<
    string,
    CursoFichaRow["areasConModulos"][number]["modulos"][number][]
  >()
  for (const m of curso.modulos) {
    const list = modulosPorArea.get(m.areaId) ?? []
    list.push({
      id: m.id,
      titulo: m.titulo,
      orden: m.orden,
      cantidadSecciones: m.secciones.length,
    })
    modulosPorArea.set(m.areaId, list)
  }

  const areasConModulos = curso.cursoAreas.map((ca) => ({
    areaId: ca.area.id,
    nombre: ca.area.nombre,
    color: ca.area.color,
    modulos: modulosPorArea.get(ca.area.id) ?? [],
  }))

  // Area principal: la del primer modulo (no archivado) por orden.
  const primerModulo = curso.modulos[0]
  const areaPrincipal = primerModulo
    ? (curso.cursoAreas.find((ca) => ca.area.id === primerModulo.areaId)?.area ?? null)
    : null

  // Yainscrito ACTIVA?
  const inscripcionActiva = await prisma.inscripcion.findFirst({
    where: { participanteId, cursoId: curso.id, estado: "ACTIVA" },
    select: { id: true },
  })

  return {
    id: curso.id,
    slug: curso.slug,
    titulo: curso.titulo,
    descripcion: curso.descripcion,
    empresaCliente: curso.empresaCliente,
    duracionEstimada: curso.duracionEstimada,
    totalModulos: curso.modulos.length,
    areaPrincipal: areaPrincipal
      ? { id: areaPrincipal.id, nombre: areaPrincipal.nombre, color: areaPrincipal.color }
      : null,
    areasConModulos,
    tieneTransversal: Number(curso.pesoProyectoTransversal) > 0,
    tieneEntrevistaIA: Number(curso.pesoEntrevistaIA) > 0,
    yaInscritoActivo: inscripcionActiva !== null,
  }
}
