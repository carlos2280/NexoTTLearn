import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  type ActualizarContenidoInput,
  type ContenidoAdminItem,
  type CrearContenidoInput,
  type ObtenerContenidosAdminResponse,
  type ReordenarContenidosInput,
  ejemploCodigoContenidoSchema,
  ejercicioContenidoSchema,
  lecturaContenidoSchema,
  recursoContenidoSchema,
  testContenidoSchema,
  videoContenidoSchema,
} from "@nexott-learn/shared-types"
import { Prisma, type TipoContenido } from "@prisma/client"
import type { ZodSchema } from "zod"
import { PrismaService } from "../../common/prisma/prisma.service"
import { type ContenidoAdminRow, mapContenidoAItem } from "./contenidos.mapper"
import {
  ERROR_CONTENIDO_NO_ENCONTRADO,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_MODULO_NO_ENCONTRADO,
  ERROR_REORDER_IDS_DESFASE,
  ERROR_REORDER_ID_AJENO,
  ERROR_REORDER_ID_DUPLICADO,
  ERROR_SECCION_NO_ENCONTRADA,
  ERROR_TIPO_INMUTABLE,
  buildErrorContenidoConEntregas,
} from "./contenidos.types"
import { getDefaultsByTipo } from "./defaults-by-tipo"

// Select reusable que devuelve la forma exacta requerida por el mapper.
const SELECT_CONTENIDO = {
  id: true,
  seccionId: true,
  tipo: true,
  titulo: true,
  orden: true,
  contenido: true,
  metadata: true,
  archivado: true,
  creadoEn: true,
  actualizadoEn: true,
} as const satisfies Prisma.ContenidoSelect

// Mapa tipo -> schema Zod del payload completo. Lo usamos para validar el
// `contenido` que llega en POST/PATCH cuando el cliente lo envia. La
// validacion se hace montando un objeto { tipo, contenido, metadata? } y
// pasandolo por el schema discriminado del tipo correspondiente — asi el
// contenido se valida con sus reglas especificas.
// Usamos Map para que las keys (valores del enum Prisma TipoContenido en
// UPPER_SNAKE_CASE) no choquen con la regla useNamingConvention que aplica
// a propiedades de objetos literales.
const SCHEMA_POR_TIPO = new Map<TipoContenido, ZodSchema<unknown>>([
  ["LECTURA", lecturaContenidoSchema],
  ["VIDEO", videoContenidoSchema],
  ["RECURSO", recursoContenidoSchema],
  ["EJEMPLO_CODIGO", ejemploCodigoContenidoSchema],
  ["EJERCICIO", ejercicioContenidoSchema],
  ["TEST", testContenidoSchema],
])

@Injectable()
export class ContenidosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerContenidos(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    incluirArchivados: boolean,
  ): Promise<ObtenerContenidosAdminResponse> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    const where: Prisma.ContenidoWhereInput = incluirArchivados
      ? { seccionId }
      : { seccionId, archivado: false }

    const contenidos: readonly ContenidoAdminRow[] = await this.prisma.contenido.findMany({
      where,
      orderBy: { orden: "asc" },
      select: SELECT_CONTENIDO,
    })

    return { items: contenidos.map(mapContenidoAItem) }
  }

  async obtenerContenido(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    contenidoId: string,
  ): Promise<ContenidoAdminItem> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    const contenido = await this.prisma.contenido.findFirst({
      where: { id: contenidoId, seccionId },
      select: SELECT_CONTENIDO,
    })
    if (!contenido) {
      throw new NotFoundException(ERROR_CONTENIDO_NO_ENCONTRADO)
    }
    return mapContenidoAItem(contenido satisfies ContenidoAdminRow)
  }

  async crearContenido(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    input: CrearContenidoInput,
  ): Promise<ContenidoAdminItem> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    // Si el cliente envia payload, validarlo contra el schema del tipo. Si
    // no, aplicar defaults. Asi el admin puede crear bloques vacios listos
    // para editar (regla F4).
    const { contenido, metadata } = this.resolverPayload(input)

    const ordenSiguiente = await this.calcularOrdenSiguiente(seccionId)

    const creado = await this.prisma.contenido.create({
      data: {
        seccionId,
        tipo: input.tipo,
        titulo: input.titulo,
        orden: ordenSiguiente,
        contenido: contenido as Prisma.InputJsonValue,
        metadata: metadata === null ? Prisma.JsonNull : (metadata as Prisma.InputJsonValue),
      },
      select: SELECT_CONTENIDO,
    })
    return mapContenidoAItem(creado satisfies ContenidoAdminRow)
  }

  async actualizarContenido(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    contenidoId: string,
    input: ActualizarContenidoInput,
  ): Promise<ContenidoAdminItem> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    // Lee el actual para conocer el tipo (necesario para validar el
    // `contenido` con el schema correcto). Si llega `tipo` en el body
    // intentando cambiarlo, ya esta filtrado por el schema Zod de
    // ActualizarContenidoInput (que NO incluye tipo), pero lo defendemos
    // tambien aqui por si alguien llama el service directamente.
    const actual = await this.prisma.contenido.findFirst({
      where: { id: contenidoId, seccionId },
      select: { id: true, tipo: true },
    })
    if (!actual) {
      throw new NotFoundException(ERROR_CONTENIDO_NO_ENCONTRADO)
    }
    if ("tipo" in input) {
      // Defensa en profundidad: si el caller bypaseo el pipe Zod.
      throw new BadRequestException(ERROR_TIPO_INMUTABLE)
    }

    // Valida el `contenido` recibido contra el schema del tipo actual. Si no
    // valida, BadRequestException via Zod.
    let contenidoValidado: Prisma.InputJsonValue | undefined
    if (input.contenido !== undefined) {
      const schema = this.getSchemaPorTipo(actual.tipo)
      const result = schema.safeParse({
        tipo: actual.tipo,
        contenido: input.contenido,
        metadata: input.metadata ?? undefined,
      })
      if (!result.success) {
        throw new BadRequestException({
          message: "Validacion del payload de contenido fallida",
          errors: result.error.flatten().fieldErrors,
        })
      }
      contenidoValidado = input.contenido as Prisma.InputJsonValue
    }

    const data: Prisma.ContenidoUpdateInput = {
      titulo: input.titulo,
      contenido: contenidoValidado,
    }
    // Manejo explicito de metadata: undefined = no tocar, null = limpiar.
    if (input.metadata !== undefined) {
      data.metadata =
        input.metadata === null ? Prisma.JsonNull : (input.metadata as Prisma.InputJsonValue)
    }

    const actualizado = await this.prisma.contenido.update({
      where: { id: contenidoId },
      data,
      select: SELECT_CONTENIDO,
    })
    return mapContenidoAItem(actualizado satisfies ContenidoAdminRow)
  }

  async eliminarContenido(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    contenidoId: string,
  ): Promise<void> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    const existe = await this.prisma.contenido.findFirst({
      where: { id: contenidoId, seccionId },
      select: { id: true },
    })
    if (!existe) {
      throw new NotFoundException(ERROR_CONTENIDO_NO_ENCONTRADO)
    }

    // Regla de integridad: no permitimos borrar duro un contenido con
    // entregas — perderiamos historial. El admin debe archivar.
    const numEntregas = await this.prisma.entrega.count({ where: { contenidoId } })
    if (numEntregas > 0) {
      throw new ConflictException(buildErrorContenidoConEntregas(numEntregas))
    }

    await this.prisma.contenido.delete({ where: { id: contenidoId } })
  }

  archivarContenido(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    contenidoId: string,
  ): Promise<ContenidoAdminItem> {
    return this.cambiarArchivado(cursoId, moduloId, seccionId, contenidoId, true)
  }

  restaurarContenido(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    contenidoId: string,
  ): Promise<ContenidoAdminItem> {
    return this.cambiarArchivado(cursoId, moduloId, seccionId, contenidoId, false)
  }

  async reordenarContenidos(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    input: ReordenarContenidosInput,
  ): Promise<ObtenerContenidosAdminResponse> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    const existentes = await this.prisma.contenido.findMany({
      where: { seccionId },
      select: { id: true },
    })
    const idsExistentes = existentes.map((c) => c.id)
    this.validarOrdenes(idsExistentes, input.ordenes)

    // Truco de pasos negativos: el modelo tiene @@unique([seccionId, orden]),
    // asi que asignar el orden definitivo en una sola pasada chocaria con
    // valores que aun no se han movido. Pasar primero a un rango negativo
    // unico esquiva el constraint sin necesidad de RAW SQL.
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        input.ordenes.map((item, i) =>
          tx.contenido.update({
            where: { id: item.id },
            data: { orden: -(i + 1) },
          }),
        ),
      )
      await Promise.all(
        input.ordenes.map((item) =>
          tx.contenido.update({
            where: { id: item.id },
            data: { orden: item.orden },
          }),
        ),
      )
    })

    return this.obtenerContenidos(cursoId, moduloId, seccionId, true)
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers privados
  // ─────────────────────────────────────────────────────────────────

  private getSchemaPorTipo(tipo: TipoContenido): ZodSchema<unknown> {
    const schema = SCHEMA_POR_TIPO.get(tipo)
    if (!schema) {
      // Inalcanzable mientras el Map cubra el enum completo. Si Prisma agrega
      // un TipoContenido sin actualizar el Map, este throw lo hace evidente.
      throw new Error(`Tipo de contenido no soportado: ${tipo}`)
    }
    return schema
  }

  private async cambiarArchivado(
    cursoId: string,
    moduloId: string,
    seccionId: string,
    contenidoId: string,
    archivado: boolean,
  ): Promise<ContenidoAdminItem> {
    await this.verificarSeccionPerteneceModulo(cursoId, moduloId, seccionId)

    const existe = await this.prisma.contenido.findFirst({
      where: { id: contenidoId, seccionId },
      select: { id: true, archivado: true },
    })
    if (!existe) {
      throw new NotFoundException(ERROR_CONTENIDO_NO_ENCONTRADO)
    }

    // Idempotencia: si ya esta en el estado pedido, devolvemos sin tocar BD.
    if (existe.archivado === archivado) {
      const sinCambio = await this.prisma.contenido.findUniqueOrThrow({
        where: { id: contenidoId },
        select: SELECT_CONTENIDO,
      })
      return mapContenidoAItem(sinCambio satisfies ContenidoAdminRow)
    }

    const actualizado = await this.prisma.contenido.update({
      where: { id: contenidoId },
      data: { archivado },
      select: SELECT_CONTENIDO,
    })
    return mapContenidoAItem(actualizado satisfies ContenidoAdminRow)
  }

  private resolverPayload(input: CrearContenidoInput): {
    contenido: unknown
    metadata: Record<string, unknown> | null
  } {
    if (input.contenido === undefined) {
      const defaults = getDefaultsByTipo(input.tipo)
      return {
        contenido: defaults.contenido,
        metadata: input.metadata !== undefined ? (input.metadata ?? null) : defaults.metadata,
      }
    }
    // Cliente envio payload — validar con el schema del tipo.
    const schema = this.getSchemaPorTipo(input.tipo)
    const result = schema.safeParse({
      tipo: input.tipo,
      contenido: input.contenido,
      metadata: input.metadata ?? undefined,
    })
    if (!result.success) {
      throw new BadRequestException({
        message: "Validacion del payload de contenido fallida",
        errors: result.error.flatten().fieldErrors,
      })
    }
    return {
      contenido: input.contenido,
      metadata: input.metadata !== undefined ? (input.metadata ?? null) : null,
    }
  }

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

  private async calcularOrdenSiguiente(seccionId: string): Promise<number> {
    const max = await this.prisma.contenido.aggregate({
      where: { seccionId },
      _max: { orden: true },
    })
    return (max._max.orden ?? 0) + 1
  }

  private validarOrdenes(
    existentes: readonly string[],
    recibidos: readonly { id: string; orden: number }[],
  ): void {
    if (existentes.length !== recibidos.length) {
      throw new BadRequestException(
        `${ERROR_REORDER_IDS_DESFASE}. Esperados ${existentes.length}, recibidos ${recibidos.length}.`,
      )
    }
    const ids = recibidos.map((r) => r.id)
    const setExistentes = new Set(existentes)
    const setRecibidos = new Set(ids)
    if (setRecibidos.size !== ids.length) {
      throw new BadRequestException(ERROR_REORDER_ID_DUPLICADO)
    }
    for (const id of ids) {
      if (!setExistentes.has(id)) {
        throw new BadRequestException(`${ERROR_REORDER_ID_AJENO}: ${id}`)
      }
    }
  }
}
