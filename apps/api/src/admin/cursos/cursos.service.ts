import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarCursoInput,
  ActualizarPesosCursoInput,
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
  ERROR_CURSO_DESHABILITADO,
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
  tipoPesos: {
    select: { tipo: true, peso: true, nivel: true },
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

  /**
   * Actualiza los pesos de un curso (decision P3.1).
   *
   * Por nivel ('modulo' o 'curso') se hace un "replace": los tipos que vienen
   * en el input se upsertean, y los tipos del MISMO nivel que NO vienen se
   * borran. Niveles no tocados en el input no se modifican (PATCH parcial por
   * nivel). La validacion estructural (suma=100 intra-modulo, <=100 nivel
   * curso, tipo coherente con nivel) la hace el ZodValidationPipe; aqui solo
   * se valida el invariante de existencia/estado del curso.
   */
  async actualizarPesos(
    cursoId: string,
    input: ActualizarPesosCursoInput,
  ): Promise<CursoAdminDetalle> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, estado: true },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    if (curso.estado === "DESHABILITADO") {
      throw new BadRequestException(ERROR_CURSO_DESHABILITADO)
    }

    const nivelesEnInput = new Set(input.pesos.map((p) => p.nivel))

    await this.prisma.$transaction(async (tx) => {
      for (const nivel of nivelesEnInput) {
        const tiposEnInput = input.pesos.filter((p) => p.nivel === nivel).map((p) => p.tipo)

        // Borra los tipos del mismo nivel que NO vienen en el input.
        // Esto hace que desactivar la entrevista (mandar solo proyecto en
        // nivel='curso') la elimine fisicamente de la BD.
        await tx.cursoTipoPeso.deleteMany({
          where: {
            cursoId,
            nivel,
            tipo: { notIn: tiposEnInput },
          },
        })
      }

      // Upsert por (cursoId, tipo) — la PK del modelo. El nivel se actualiza
      // tambien por si un mismo tipo cambiara de nivel (no deberia, pero si
      // el front manda algo raro la BD queda consistente).
      for (const item of input.pesos) {
        await tx.cursoTipoPeso.upsert({
          // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@id([cursoId, tipo])
          where: { cursoId_tipo: { cursoId, tipo: item.tipo } },
          create: {
            cursoId,
            tipo: item.tipo,
            peso: item.peso,
            nivel: item.nivel,
          },
          update: {
            peso: item.peso,
            nivel: item.nivel,
          },
        })
      }
    })

    // Re-lectura del detalle completo para devolver el estado consolidado al
    // front (incluye el resto del curso, no solo los pesos).
    const detalle = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: SELECT_DETALLE,
    })
    if (!detalle) {
      // Practicamente imposible (acabamos de validar existencia), pero el
      // tipado de findUnique nos obliga a manejar el caso.
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    return mapCursoADetalle(detalle satisfies CursoAdminDetalleRow)
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
