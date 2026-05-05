import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarModuloInput,
  ClonarModuloInput,
  CrearModuloInput,
  ModuloAdminItem,
  ObtenerModulosAdminResponse,
  ReordenarModulosInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { type ModuloAdminRow, calcularPesoTotal, mapModuloAItem } from "./modulos.mapper"
import {
  CLONE_SUFFIX,
  ERROR_AREA_NO_ENCONTRADA,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_MODULO_NO_ENCONTRADO,
  ERROR_MODULO_ORIGEN_NO_ENCONTRADO,
  ERROR_REORDER_IDS_DESFASE,
  ERROR_SLUG_DUPLICADO,
  PRISMA_ERROR_UNIQUE_CONSTRAINT,
} from "./modulos.types"

// Select reusable que devuelve la forma exacta requerida por el mapper. Lo
// extrae como constante para que las cuatro queries (lista, detalle, crear,
// actualizar) devuelvan exactamente los mismos campos.
const SELECT_MODULO = {
  id: true,
  cursoId: true,
  titulo: true,
  slug: true,
  descripcion: true,
  orden: true,
  estado: true,
  duracionEstimada: true,
  peso: true,
  puntajeObjetivo: true,
  area: {
    select: {
      id: true,
      nombre: true,
      color: true,
    },
  },
  _count: {
    select: {
      secciones: true,
    },
  },
  secciones: {
    select: {
      _count: {
        select: {
          contenidos: true,
        },
      },
    },
  },
} as const satisfies Prisma.ModuloSelect

@Injectable()
export class ModulosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerModulos(cursoId: string): Promise<ObtenerModulosAdminResponse> {
    await this.verificarCursoExiste(cursoId)

    const modulos: readonly ModuloAdminRow[] = await this.prisma.modulo.findMany({
      where: { cursoId },
      orderBy: { orden: "asc" },
      select: SELECT_MODULO,
    })

    const items = modulos.map(mapModuloAItem)
    return { items, pesoTotal: calcularPesoTotal(items) }
  }

  async obtenerModulo(cursoId: string, moduloId: string): Promise<ModuloAdminItem> {
    await this.verificarCursoExiste(cursoId)

    // Filtra por cursoId ademas del id para que /cursoX/modulos/idDeOtroCurso
    // devuelva 404 en lugar de mostrar un modulo de otro curso.
    const modulo = await this.prisma.modulo.findFirst({
      where: { id: moduloId, cursoId },
      select: SELECT_MODULO,
    })
    if (!modulo) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
    return mapModuloAItem(modulo satisfies ModuloAdminRow)
  }

  async crearModulo(cursoId: string, input: CrearModuloInput): Promise<ModuloAdminItem> {
    await this.verificarCursoExiste(cursoId)
    if (input.areaId) {
      await this.verificarAreaExiste(input.areaId)
    }

    const ordenSiguiente = await this.calcularOrdenSiguiente(cursoId)

    try {
      const modulo = await this.prisma.modulo.create({
        data: {
          cursoId,
          titulo: input.titulo,
          slug: input.slug,
          descripcion: input.descripcion,
          duracionEstimada: input.duracionEstimada ?? null,
          peso: input.peso ?? null,
          puntajeObjetivo: input.puntajeObjetivo ?? null,
          areaId: input.areaId ?? null,
          estado: input.estado,
          orden: ordenSiguiente,
        },
        select: SELECT_MODULO,
      })
      return mapModuloAItem(modulo satisfies ModuloAdminRow)
    } catch (error) {
      this.traducirErrorPrisma(error)
    }
  }

  async actualizarModulo(
    cursoId: string,
    moduloId: string,
    input: ActualizarModuloInput,
  ): Promise<ModuloAdminItem> {
    await this.verificarCursoExiste(cursoId)
    await this.verificarModuloPerteneceCurso(cursoId, moduloId)
    if (input.areaId) {
      await this.verificarAreaExiste(input.areaId)
    }

    try {
      const modulo = await this.prisma.modulo.update({
        where: { id: moduloId },
        data: this.construirDataUpdate(input),
        select: SELECT_MODULO,
      })
      return mapModuloAItem(modulo satisfies ModuloAdminRow)
    } catch (error) {
      this.traducirErrorPrisma(error)
    }
  }

  async eliminarModulo(cursoId: string, moduloId: string): Promise<{ ok: true }> {
    await this.verificarCursoExiste(cursoId)

    const existe = await this.prisma.modulo.findFirst({
      where: { id: moduloId, cursoId },
      select: { id: true, _count: { select: { secciones: true } } },
    })
    if (!existe) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
    if (existe._count.secciones > 0) {
      // Mensaje con N para que el admin sepa cuantas secciones tendria que
      // borrar antes de poder eliminar el modulo.
      throw new ConflictException(
        `No se puede eliminar: el modulo tiene ${existe._count.secciones} secciones. Elimina las secciones primero.`,
      )
    }

    await this.prisma.modulo.delete({ where: { id: moduloId } })
    return { ok: true }
  }

  async reordenarModulos(
    cursoId: string,
    input: ReordenarModulosInput,
  ): Promise<ObtenerModulosAdminResponse> {
    await this.verificarCursoExiste(cursoId)

    const existentes = await this.prisma.modulo.findMany({
      where: { cursoId },
      select: { id: true },
    })
    const idsExistentes = existentes.map((m) => m.id)
    this.validarIdsCoinciden(idsExistentes, input.ids)

    // Truco de pasos negativos: el modelo tiene @@unique([cursoId, orden]),
    // asi que asignar el orden definitivo en una sola pasada chocaria con
    // valores que aun no se han movido. Pasar primero a un rango negativo
    // unico esquiva el constraint sin necesidad de RAW SQL ni de borrar e
    // insertar.
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        input.ids.map((id, i) =>
          tx.modulo.update({
            where: { id },
            data: { orden: -(i + 1) },
          }),
        ),
      )
      await Promise.all(
        input.ids.map((id, i) =>
          tx.modulo.update({
            where: { id },
            data: { orden: i + 1 },
          }),
        ),
      )
    })

    return this.obtenerModulos(cursoId)
  }

  async clonarModulo(cursoId: string, input: ClonarModuloInput): Promise<ModuloAdminItem> {
    await this.verificarCursoExiste(cursoId)

    const origen = await this.prisma.modulo.findUnique({
      where: { id: input.moduloOrigenId },
      select: {
        id: true,
        cursoId: true,
        titulo: true,
        slug: true,
        descripcion: true,
        duracionEstimada: true,
        peso: true,
        puntajeObjetivo: true,
        areaId: true,
      },
    })
    if (!origen) {
      throw new NotFoundException(ERROR_MODULO_ORIGEN_NO_ENCONTRADO)
    }

    const slugDestino = await this.generarSlugUnico(cursoId, origen.slug)
    const ordenSiguiente = await this.calcularOrdenSiguiente(cursoId)

    // Transaccion: crear modulo clonado y registrar trazabilidad en
    // ModuloOrigen como una sola unidad de trabajo.
    const moduloId = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.modulo.create({
        data: {
          cursoId,
          titulo: origen.titulo + CLONE_SUFFIX,
          slug: slugDestino,
          descripcion: origen.descripcion,
          duracionEstimada: origen.duracionEstimada,
          peso: origen.peso,
          puntajeObjetivo: origen.puntajeObjetivo,
          areaId: origen.areaId,
          orden: ordenSiguiente,
          // Forzado: el clon siempre arranca como BORRADOR sin importar el
          // estado del origen (decision UX del proyecto).
          estado: "BORRADOR",
        },
        select: { id: true },
      })

      await tx.moduloOrigen.create({
        data: {
          moduloId: creado.id,
          moduloOrigenId: origen.id,
          cursoOrigenId: origen.cursoId,
        },
      })

      return creado.id
    })

    // Releer con el select completo para devolver el item ya mapeado.
    const moduloCompleto = await this.prisma.modulo.findUniqueOrThrow({
      where: { id: moduloId },
      select: SELECT_MODULO,
    })
    return mapModuloAItem(moduloCompleto satisfies ModuloAdminRow)
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

  private async verificarAreaExiste(areaId: string): Promise<void> {
    const area = await this.prisma.areaCompetencia.findUnique({
      where: { id: areaId },
      select: { id: true },
    })
    if (!area) {
      throw new NotFoundException(ERROR_AREA_NO_ENCONTRADA)
    }
  }

  private async verificarModuloPerteneceCurso(cursoId: string, moduloId: string): Promise<void> {
    const modulo = await this.prisma.modulo.findFirst({
      where: { id: moduloId, cursoId },
      select: { id: true },
    })
    if (!modulo) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
  }

  private async calcularOrdenSiguiente(cursoId: string): Promise<number> {
    const max = await this.prisma.modulo.aggregate({
      where: { cursoId },
      _max: { orden: true },
    })
    return (max._max.orden ?? 0) + 1
  }

  // Genera un slug libre dentro del curso destino. Si `{base}` ya existe,
  // intenta `{base}-2`, `{base}-3`, ... hasta encontrar uno libre. El loop
  // tiene un tope defensivo para evitar bucles infinitos en escenarios
  // patologicos (no esperables en la practica).
  private async generarSlugUnico(cursoId: string, base: string): Promise<string> {
    const maxIntentos = 1000
    for (let i = 1; i <= maxIntentos; i += 1) {
      const candidato = i === 1 ? base : `${base}-${i}`
      const existente = await this.prisma.modulo.findFirst({
        where: { cursoId, slug: candidato },
        select: { id: true },
      })
      if (!existente) {
        return candidato
      }
    }
    // Si llegamos aqui, hay 1000 colisiones: algo esta muy mal.
    throw new ConflictException(ERROR_SLUG_DUPLICADO)
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
      // Hay duplicados dentro del array recibido.
      throw new BadRequestException(`${ERROR_REORDER_IDS_DESFASE}. Hay ids duplicados.`)
    }
    for (const id of recibidos) {
      if (!setExistentes.has(id)) {
        throw new BadRequestException(
          `${ERROR_REORDER_IDS_DESFASE}. El id ${id} no pertenece al curso.`,
        )
      }
    }
  }

  // Construye el `data` del update aplicando solo los campos definidos.
  // Para nullables (descripcion, duracionEstimada, peso, puntajeObjetivo, areaId),
  // un null explicito borra el valor; ausente significa "no tocar".
  // Prisma trata `undefined` como "no tocar".
  private construirDataUpdate(input: ActualizarModuloInput): Prisma.ModuloUpdateInput {
    return {
      titulo: input.titulo,
      slug: input.slug,
      descripcion: input.descripcion,
      duracionEstimada: input.duracionEstimada,
      peso: input.peso,
      puntajeObjetivo: input.puntajeObjetivo,
      estado: input.estado,
      // areaId va via nested relation: connect cuando hay id, disconnect
      // cuando viene null. `undefined` = no tocar.
      area:
        input.areaId === undefined
          ? undefined
          : input.areaId === null
            ? { disconnect: true }
            : { connect: { id: input.areaId } },
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
