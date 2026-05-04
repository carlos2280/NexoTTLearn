import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  ActualizarCursoInput,
  CrearCursoInput,
  CursoAdminDetalle,
  ObtenerCursosAdminResponse,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  type CursoAdminDetalleRow,
  type CursoAdminRow,
  mapCursoADetalle,
  mapCursoARow,
} from "./cursos.mapper"
import {
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_SLUG_DUPLICADO,
  PRISMA_ERROR_UNIQUE_CONSTRAINT,
} from "./cursos.types"

// Select reusable para detalle. Lo extrae como constante para que las tres
// queries (crear, obtener, actualizar) devuelvan exactamente los mismos campos
// y el mapper reciba la misma forma.
const SELECT_DETALLE = {
  id: true,
  titulo: true,
  slug: true,
  descripcion: true,
  estado: true,
  nivel: true,
  umbralExcelencia: true,
  umbralAprobado: true,
  umbralEnDesarrollo: true,
  _count: {
    select: {
      modulos: true,
      inscripciones: true,
    },
  },
  inscripciones: {
    select: {
      progresoCurso: { select: { estado: true } },
    },
  },
} as const satisfies Prisma.CursoSelect

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerCursos(): Promise<ObtenerCursosAdminResponse> {
    // Una sola query con select explicito + _count + nested select para
    // calcular completionRate sin N+1. La agregacion final ocurre en memoria
    // dentro del mapper (no se trae el detalle de cada inscripcion, solo el
    // estado del progreso asociado).
    const cursos: readonly CursoAdminRow[] = await this.prisma.curso.findMany({
      orderBy: { actualizadoEn: "desc" },
      select: {
        id: true,
        titulo: true,
        slug: true,
        descripcion: true,
        estado: true,
        _count: {
          select: {
            modulos: true,
            inscripciones: true,
          },
        },
        inscripciones: {
          select: {
            progresoCurso: { select: { estado: true } },
          },
        },
      },
    })

    return { items: cursos.map(mapCursoARow) }
  }

  async obtenerCursoPorId(id: string): Promise<CursoAdminDetalle> {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      select: SELECT_DETALLE,
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    return mapCursoADetalle(curso satisfies CursoAdminDetalleRow)
  }

  async crearCurso(input: CrearCursoInput): Promise<CursoAdminDetalle> {
    try {
      const curso = await this.prisma.curso.create({
        data: {
          titulo: input.titulo,
          slug: input.slug,
          descripcion: input.descripcion,
          nivel: input.nivel,
          umbralExcelencia: input.umbralExcelencia,
          umbralAprobado: input.umbralAprobado,
          umbralEnDesarrollo: input.umbralEnDesarrollo,
          // estado: BORRADOR por @default del schema; no se setea aqui.
        },
        select: SELECT_DETALLE,
      })
      return mapCursoADetalle(curso satisfies CursoAdminDetalleRow)
    } catch (error) {
      this.traducirErrorPrisma(error)
    }
  }

  async actualizarCurso(id: string, input: ActualizarCursoInput): Promise<CursoAdminDetalle> {
    // Verifica existencia antes del update para lanzar 404 explicito en lugar
    // de dejar que Prisma devuelva P2025 (que viajaria como 500 sin handling).
    const existe = await this.prisma.curso.findUnique({ where: { id }, select: { id: true } })
    if (!existe) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }

    // TODO(publicacion): cuando se implemente PATCH de estado a PUBLICADO, validar
    // que el curso tenga al menos 1 modulo + 1 seccion + 1 contenido (regla de
    // negocio AD03). Por ahora, este endpoint solo actualiza campos del tab
    // General y no permite cambiar estado.

    try {
      const curso = await this.prisma.curso.update({
        where: { id },
        data: this.construirDataUpdate(input),
        select: SELECT_DETALLE,
      })
      return mapCursoADetalle(curso satisfies CursoAdminDetalleRow)
    } catch (error) {
      this.traducirErrorPrisma(error)
    }
  }

  // Construye el `data` del update aplicando solo los campos que vienen en el
  // input. Para `descripcion`, un null explicito borra el valor (set null);
  // ausente significa "no tocar". Prisma trata `undefined` como "no tocar".
  private construirDataUpdate(input: ActualizarCursoInput): Prisma.CursoUpdateInput {
    return {
      titulo: input.titulo,
      slug: input.slug,
      descripcion: input.descripcion,
      nivel: input.nivel,
      umbralExcelencia: input.umbralExcelencia,
      umbralAprobado: input.umbralAprobado,
      umbralEnDesarrollo: input.umbralEnDesarrollo,
    }
  }

  // Centraliza la traduccion de errores Prisma a excepciones HTTP. `never`
  // como tipo de retorno deja claro que siempre lanza; el caller no necesita
  // un return adicional tras la llamada.
  private traducirErrorPrisma(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_ERROR_UNIQUE_CONSTRAINT
    ) {
      throw new ConflictException(ERROR_SLUG_DUPLICADO)
    }
    throw error
  }
}
