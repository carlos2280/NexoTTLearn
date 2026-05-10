// Carga la vitrina del catalogo libre para el participante.
//
// Reglas:
//   - Curso.permiteInscripcionLibre = true.
//   - Curso.estado = ACTIVO.
//   - El participante NO tiene una Inscripcion(estado=ACTIVA) en el curso.
//   - Filtros aplicables (AND): texto libre `q`, area, banda de duracion.
//   - Cursor por id. Orden estable: createdAt desc, id desc.

import type { CatalogoVitrinaQuery } from "@nexott-learn/shared-types"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { type CursoCatalogoRow, bandaDuracion } from "./catalogo.types"

const LIMITE_DEFAULT = 18

const SELECT_VITRINA = {
  id: true,
  slug: true,
  titulo: true,
  descripcion: true,
  empresaCliente: true,
  duracionEstimada: true,
  modulos: {
    where: { archivadoAt: null },
    select: {
      id: true,
      orden: true,
      area: { select: { id: true, nombre: true, color: true } },
    },
    orderBy: { orden: "asc" as const },
  },
} as const

export interface VitrinaQueryResult {
  readonly rows: CursoCatalogoRow[]
  readonly nextCursor: string | null
  readonly totalDisponibles: number
  readonly totalSinFiltros: number
  readonly areasDisponibles: ReadonlyArray<{ id: string; nombre: string; color: string }>
}

export async function cargarVitrina(
  prisma: PrismaService,
  participanteId: string,
  query: CatalogoVitrinaQuery,
): Promise<VitrinaQueryResult> {
  const limite = query.limite ?? LIMITE_DEFAULT

  // Cursos en los que el participante tiene inscripcion ACTIVA → excluir.
  const inscripcionesActivas = await prisma.inscripcion.findMany({
    where: { participanteId, estado: "ACTIVA" },
    select: { cursoId: true },
  })
  const excluirIds: string[] = inscripcionesActivas.map((i) => i.cursoId)

  const idFiltro = excluirIds.length === 0 ? undefined : { notIn: excluirIds }

  // Total sin filtros (para diferenciar "vacio total" vs "sin resultados").
  const totalSinFiltros = await prisma.curso.count({
    where: {
      permiteInscripcionLibre: true,
      estado: "ACTIVO",
      ...(idFiltro ? { id: idFiltro } : {}),
    },
  })

  // Filtro por texto libre. Prisma usa el operador `OR` en mayuscula (API publica).
  const filtroTexto = construirFiltroTexto(query.q)

  // Filtro por area: el curso tiene esa area en CursoArea.
  const filtroArea = query.area ? { cursoAreas: { some: { areaId: query.area } } } : {}

  const whereBase = {
    permiteInscripcionLibre: true,
    estado: "ACTIVO" as const,
    ...(idFiltro ? { id: idFiltro } : {}),
    ...filtroTexto,
    ...filtroArea,
  }

  // Total tras filtros (sin paginar). Para el filtro de duracion (que es una
  // heuristica sobre texto) contamos despues de cargar; aqui contamos el
  // resto.
  const totalConFiltrosBd = await prisma.curso.count({ where: whereBase })

  // Cargar pagina + 1 para detectar nextCursor. La duracion se filtra en
  // memoria porque es heuristica sobre texto libre.
  const cursosBd = query.cursor
    ? await prisma.curso.findMany({
        where: whereBase,
        select: SELECT_VITRINA,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limite + 1,
        cursor: { id: query.cursor },
        skip: 1,
      })
    : await prisma.curso.findMany({
        where: whereBase,
        select: SELECT_VITRINA,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limite + 1,
      })

  // Aplicar filtro de duracion en memoria (heuristica sobre texto).
  const filtroDuracion = query.duracion
  const filtrados = filtroDuracion
    ? cursosBd.filter((c) => bandaDuracion(c.duracionEstimada) === filtroDuracion)
    : cursosBd

  const tieneSiguiente = filtrados.length > limite
  const pagina = tieneSiguiente ? filtrados.slice(0, limite) : filtrados
  const nextCursor =
    tieneSiguiente && pagina.length > 0 ? (pagina[pagina.length - 1]?.id ?? null) : null

  const rows: CursoCatalogoRow[] = pagina.map((c) => {
    const primerModulo = c.modulos[0]
    const areaPrincipal = primerModulo
      ? {
          id: primerModulo.area.id,
          nombre: primerModulo.area.nombre,
          color: primerModulo.area.color,
        }
      : null
    return {
      id: c.id,
      slug: c.slug,
      titulo: c.titulo,
      descripcion: c.descripcion,
      empresaCliente: c.empresaCliente,
      duracionEstimada: c.duracionEstimada,
      totalModulos: c.modulos.length,
      areaPrincipal,
    }
  })

  // Lista de areas disponibles para el dropdown de filtros: las areas que
  // realmente aparecen en cursos del catalogo (sin aplicar filtros del usuario).
  const areasDisponibles = await cargarAreasDisponibles(prisma, excluirIds)

  return {
    rows,
    nextCursor,
    // Si hay filtro de duracion, el total real es el de la pagina filtrada en
    // memoria + paginas siguientes; aproximamos con totalConFiltrosBd. Cuando
    // la duracion no se puede contar exacta, devolvemos el total bd como cota
    // superior.
    totalDisponibles: totalConFiltrosBd,
    totalSinFiltros,
    areasDisponibles,
  }
}

function construirFiltroTexto(q: string | undefined) {
  if (!q) {
    return {}
  }
  return {
    // biome-ignore lint/style/useNamingConvention: clave OR es API publica de Prisma
    OR: [
      { titulo: { contains: q, mode: "insensitive" as const } },
      { descripcion: { contains: q, mode: "insensitive" as const } },
    ],
  }
}

async function cargarAreasDisponibles(
  prisma: PrismaService,
  excluirIds: string[],
): Promise<ReadonlyArray<{ id: string; nombre: string; color: string }>> {
  // Areas de los modulos de cursos del catalogo (no excluidos).
  const cursoIdFiltro = excluirIds.length === 0 ? {} : { id: { notIn: excluirIds } }
  const modulos = await prisma.modulo.findMany({
    where: {
      archivadoAt: null,
      curso: {
        permiteInscripcionLibre: true,
        estado: "ACTIVO",
        ...cursoIdFiltro,
      },
    },
    select: { area: { select: { id: true, nombre: true, color: true } } },
  })
  const map = new Map<string, { id: string; nombre: string; color: string }>()
  for (const m of modulos) {
    map.set(m.area.id, { id: m.area.id, nombre: m.area.nombre, color: m.area.color })
  }
  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
}
