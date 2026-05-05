import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarSeccionInput,
  CrearSeccionInput,
  ObtenerSeccionesAdminResponse,
  ReordenarSeccionesInput,
  SeccionAdminItem,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { type SeccionAdminRow, mapSeccionAItem } from "./secciones.mapper"
import {
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_MODULO_NO_ENCONTRADO,
  ERROR_REORDER_IDS_DESFASE,
  ERROR_SECCION_NO_ENCONTRADA,
} from "./secciones.types"

// Select reusable que devuelve la forma exacta requerida por el mapper.
// Lo extrae como constante para que las queries de lista, crear, actualizar
// y reorder devuelvan exactamente los mismos campos.
const SELECT_SECCION = {
  id: true,
  moduloId: true,
  titulo: true,
  orden: true,
  creadoEn: true,
  actualizadoEn: true,
  contenidos: {
    orderBy: { orden: "asc" },
    select: {
      id: true,
      seccionId: true,
      tipo: true,
      titulo: true,
      orden: true,
      metadata: true,
      archivado: true,
      creadoEn: true,
      actualizadoEn: true,
    },
  },
} as const satisfies Prisma.SeccionSelect

@Injectable()
export class SeccionesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerSecciones(
    cursoId: string,
    moduloId: string,
  ): Promise<ObtenerSeccionesAdminResponse> {
    await this.verificarModuloPerteneceCurso(cursoId, moduloId)

    const secciones: readonly SeccionAdminRow[] = await this.prisma.seccion.findMany({
      where: { moduloId },
      orderBy: { orden: "asc" },
      select: SELECT_SECCION,
    })

    return { items: secciones.map(mapSeccionAItem) }
  }

  async crearSeccion(
    cursoId: string,
    moduloId: string,
    input: CrearSeccionInput,
  ): Promise<SeccionAdminItem> {
    await this.verificarModuloPerteneceCurso(cursoId, moduloId)
    const ordenSiguiente = await this.calcularOrdenSiguiente(moduloId)

    const seccion = await this.prisma.seccion.create({
      data: {
        moduloId,
        titulo: input.titulo,
        orden: ordenSiguiente,
      },
      select: SELECT_SECCION,
    })
    return mapSeccionAItem(seccion satisfies SeccionAdminRow)
  }

  async actualizarSeccion(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    input: ActualizarSeccionInput,
  ): Promise<SeccionAdminItem> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    const seccion = await this.prisma.seccion.update({
      where: { id: seccionId },
      data: {
        // Prisma trata `undefined` como "no tocar". Asi el PATCH parcial no
        // pisa campos no enviados.
        titulo: input.titulo,
      },
      select: SELECT_SECCION,
    })
    return mapSeccionAItem(seccion satisfies SeccionAdminRow)
  }

  async eliminarSeccion(
    cursoId: string,
    moduloId: string,
    seccionId: string,
  ): Promise<{ ok: true }> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    // Regla de integridad: si algun contenido de la seccion tiene entregas,
    // no permitimos borrar duro — se perderia historial. El admin debe
    // archivar los contenidos primero.
    const numEntregas = await this.prisma.entrega.count({
      where: { contenido_: { seccionId } },
    })
    if (numEntregas > 0) {
      throw new ConflictException(
        `No se puede eliminar: la seccion tiene ${numEntregas} contenidos con entregas. Archiva los contenidos primero.`,
      )
    }

    await this.prisma.seccion.delete({ where: { id: seccionId } })
    return { ok: true }
  }

  async reordenarSecciones(
    cursoId: string,
    moduloId: string,
    input: ReordenarSeccionesInput,
  ): Promise<ObtenerSeccionesAdminResponse> {
    await this.verificarModuloPerteneceCurso(cursoId, moduloId)

    const existentes = await this.prisma.seccion.findMany({
      where: { moduloId },
      select: { id: true },
    })
    const idsExistentes = existentes.map((s) => s.id)
    this.validarIdsCoinciden(idsExistentes, input.ids)

    // Truco de pasos negativos: el modelo tiene @@unique([moduloId, orden]),
    // asi que asignar el orden definitivo en una sola pasada chocaria con
    // valores que aun no se han movido. Pasar primero a un rango negativo
    // unico esquiva el constraint sin necesidad de RAW SQL.
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        input.ids.map((id, i) =>
          tx.seccion.update({
            where: { id },
            data: { orden: -(i + 1) },
          }),
        ),
      )
      await Promise.all(
        input.ids.map((id, i) =>
          tx.seccion.update({
            where: { id },
            data: { orden: i + 1 },
          }),
        ),
      )
    })

    return this.obtenerSecciones(cursoId, moduloId)
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers privados
  // ─────────────────────────────────────────────────────────────────

  private async verificarCursoExiste(cursoId: string): Promise<void> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
  }

  private async verificarModuloPerteneceCurso(cursoId: string, moduloId: string): Promise<void> {
    await this.verificarCursoExiste(cursoId)
    const modulo = await this.prisma.modulo.findFirst({
      where: { id: moduloId, cursoId },
      select: { id: true },
    })
    if (!modulo) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
  }

  private async verificarSeccionPerteneceModulo(
    cursoId: string,
    moduloId: string,
    seccionId: string,
  ): Promise<void> {
    await this.verificarModuloPerteneceCurso(cursoId, moduloId)
    const seccion = await this.prisma.seccion.findFirst({
      where: { id: seccionId, moduloId },
      select: { id: true },
    })
    if (!seccion) {
      throw new NotFoundException(ERROR_SECCION_NO_ENCONTRADA)
    }
  }

  private async calcularOrdenSiguiente(moduloId: string): Promise<number> {
    const max = await this.prisma.seccion.aggregate({
      where: { moduloId },
      _max: { orden: true },
    })
    return (max._max.orden ?? 0) + 1
  }

  private validarIdsCoinciden(existentes: readonly string[], recibidos: readonly string[]): void {
    if (existentes.length !== recibidos.length) {
      throw new BadRequestException(
        `${ERROR_REORDER_IDS_DESFASE}. Esperados ${existentes.length}, recibidos ${recibidos.length}.`,
      )
    }
    const setExistentes = new Set(existentes)
    const setRecibidos = new Set(recibidos)
    if (setRecibidos.size !== recibidos.length) {
      throw new BadRequestException(`${ERROR_REORDER_IDS_DESFASE}. Hay ids duplicados.`)
    }
    for (const id of recibidos) {
      if (!setExistentes.has(id)) {
        throw new BadRequestException(
          `${ERROR_REORDER_IDS_DESFASE}. El id ${id} no pertenece al modulo.`,
        )
      }
    }
  }
}
