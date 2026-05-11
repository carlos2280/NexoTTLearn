import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import {
  ActualizarAreasCursoInput,
  ActualizarCursoInput,
  ActualizarEntrevistaIaCursoInput,
  ActualizarModulosHabilitadosCursoInput,
  ActualizarPesosCursoInput,
  ActualizarSkillsExigidasCursoInput,
  ActualizarTransversalCursoInput,
  ActualizarUmbralesLogroCursoInput,
  CrearCursoInput,
  CursoConfiguracionResponse,
  CursoDetalle,
  CursoResumen,
  DuplicarCursoInput,
  DuplicarCursoResponse,
  ListarCursosQuery,
  ListarLogCambiosQuery,
  LogCambioCurso as LogCambioCursoDto,
  Paginated,
  SkillSinCobertura,
  UmbralesLogroValores,
} from "@nexott-learn/shared-types"
import { AccionLogCurso, EstadoCurso, EstadoModulo, Prisma, RolUsuario } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import {
  type CursoPublicacionSnapshot,
  calcularDiffComposite,
  construirPesosCambiados,
  validarDuracionEntrevistaIa,
  validarMonotoniaUmbralesLogro,
  validarPrecondicionesPublicacion,
  validarSumaPesosCien,
} from "./cursos.helpers"

/**
 * Selects explicitos del recurso Curso. D-CUR-12.
 *
 * `SELECT_CURSO_RESUMEN_FIELDS` para listados (no incluye sub-tablas).
 * `SELECT_CURSO_DETALLE_FIELDS` para `GET /:id`, mutaciones, duplicado, etc.
 */
const SELECT_CURSO_RESUMEN_FIELDS = {
  id: true,
  titulo: true,
  clienteId: true,
  estado: true,
  fechaInicio: true,
  fechaDeadline: true,
  fechaCierre: true,
  toggleVoluntarios: true,
  desbloqueo: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CursoSelect

const SELECT_CURSO_DETALLE_FIELDS = {
  id: true,
  titulo: true,
  clienteId: true,
  estado: true,
  fechaInicio: true,
  fechaDeadline: true,
  fechaCierre: true,
  toggleVoluntarios: true,
  toggleCierreAutomatico: true,
  umbralNoCumple: true,
  pesoBloques: true,
  pesoTransversal: true,
  pesoEntrevista: true,
  transversalId: true,
  entrevistaIaId: true,
  umbralesLogro: true,
  desbloqueo: true,
  fechaDesbloqueo: true,
  createdAt: true,
  updatedAt: true,
  areasExigidas: {
    select: { areaId: true, peso: true, puntajeObjetivo: true },
  },
  skillsExigidas: {
    select: { skillId: true, notaMinima: true },
  },
  modulosHabilitados: {
    select: { moduloId: true },
  },
} as const satisfies Prisma.CursoSelect

const SELECT_LOG_CAMBIO_FIELDS = {
  id: true,
  cursoId: true,
  fecha: true,
  autorUsuarioId: true,
  accion: true,
  motivo: true,
  previewImpacto: true,
} as const satisfies Prisma.LogCambioCursoSelect

type CursoResumenRow = Prisma.CursoGetPayload<{ select: typeof SELECT_CURSO_RESUMEN_FIELDS }>
type CursoDetalleRow = Prisma.CursoGetPayload<{ select: typeof SELECT_CURSO_DETALLE_FIELDS }>
type LogCambioCursoRow = Prisma.LogCambioCursoGetPayload<{
  select: typeof SELECT_LOG_CAMBIO_FIELDS
}>

function dateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function toCursoResumen(row: CursoResumenRow): CursoResumen {
  return {
    id: row.id,
    titulo: row.titulo,
    clienteId: row.clienteId,
    estado: row.estado,
    fechaInicio: dateToYmd(row.fechaInicio),
    fechaDeadline: dateToYmd(row.fechaDeadline),
    fechaCierre: row.fechaCierre ? row.fechaCierre.toISOString() : null,
    toggleVoluntarios: row.toggleVoluntarios,
    desbloqueo: row.desbloqueo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toCursoDetalle(row: CursoDetalleRow): CursoDetalle {
  return {
    id: row.id,
    titulo: row.titulo,
    clienteId: row.clienteId,
    estado: row.estado,
    fechaInicio: dateToYmd(row.fechaInicio),
    fechaDeadline: dateToYmd(row.fechaDeadline),
    fechaCierre: row.fechaCierre ? row.fechaCierre.toISOString() : null,
    toggleVoluntarios: row.toggleVoluntarios,
    desbloqueo: row.desbloqueo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    toggleCierreAutomatico: row.toggleCierreAutomatico,
    umbralNoCumple: Number(row.umbralNoCumple),
    pesoBloques: Number(row.pesoBloques),
    pesoTransversal: Number(row.pesoTransversal),
    pesoEntrevista: Number(row.pesoEntrevista),
    transversalId: row.transversalId,
    entrevistaIaId: row.entrevistaIaId,
    fechaDesbloqueo: row.fechaDesbloqueo ? dateToYmd(row.fechaDesbloqueo) : null,
    areasExigidas: row.areasExigidas.map((a) => ({
      areaId: a.areaId,
      peso: Number(a.peso),
      puntajeObjetivo: Number(a.puntajeObjetivo),
    })),
    skillsExigidas: row.skillsExigidas.map((s) => ({
      skillId: s.skillId,
      notaMinima: Number(s.notaMinima),
    })),
    modulosHabilitados: row.modulosHabilitados.map((m) => ({ moduloId: m.moduloId })),
  }
}

function toLogCambio(row: LogCambioCursoRow): LogCambioCursoDto {
  const preview =
    row.previewImpacto &&
    typeof row.previewImpacto === "object" &&
    !Array.isArray(row.previewImpacto)
      ? (row.previewImpacto as Record<string, unknown>)
      : null
  return {
    id: row.id,
    cursoId: row.cursoId,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    accion: row.accion,
    motivo: row.motivo,
    previewImpacto: preview,
  }
}

interface FechaResuelta {
  readonly fechaInicio: Date
  readonly fechaDeadline: Date
  readonly fechaDesbloqueo: Date | null
}

function parseYmd(value: string, campo: string): Date {
  const partes = value.split("-")
  if (partes.length !== 3) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionCursoFechas,
      message: `Fecha inválida en campo ${campo}.`,
      details: { campo },
    })
  }
  const y = Number.parseInt(partes[0] as string, 10)
  const m = Number.parseInt(partes[1] as string, 10)
  const d = Number.parseInt(partes[2] as string, 10)
  if (!(Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d))) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionCursoFechas,
      message: `Fecha inválida en campo ${campo}.`,
      details: { campo },
    })
  }
  const fecha = new Date(Date.UTC(y, m - 1, d))
  if (Number.isNaN(fecha.getTime())) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionCursoFechas,
      message: `Fecha inválida en campo ${campo}.`,
      details: { campo },
    })
  }
  return fecha
}

type DesbloqueoValor = "ENCADENADO" | "SIEMPRE" | "DESDE_FECHA"

interface ResolverFechasInput {
  readonly fechaInicio?: string
  readonly fechaDeadline?: string
  readonly fechaDesbloqueo?: string | null
  readonly desbloqueo?: DesbloqueoValor
}

interface ResolverFechasActual {
  readonly fechaInicio: Date
  readonly fechaDeadline: Date
  readonly fechaDesbloqueo: Date | null
  readonly desbloqueo: DesbloqueoValor
}

function resolverFechaDesbloqueo(
  input: { readonly fechaDesbloqueo?: string | null },
  actual: { readonly fechaDesbloqueo: Date | null } | undefined,
  desbloqueo: DesbloqueoValor,
  fechaDeadline: Date,
): Date | null {
  if (desbloqueo !== "DESDE_FECHA") {
    // Normaliza: si no aplica, se fuerza a null aunque el cliente la envie.
    return null
  }
  const rawFd =
    input.fechaDesbloqueo === undefined
      ? (actual?.fechaDesbloqueo ?? null)
      : input.fechaDesbloqueo === null
        ? null
        : parseYmd(input.fechaDesbloqueo, "fechaDesbloqueo")
  if (!rawFd) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionCursoFechas,
      message: "fechaDesbloqueo es requerida cuando desbloqueo='DESDE_FECHA'.",
      details: { campo: "fechaDesbloqueo" },
    })
  }
  if (rawFd.getTime() > fechaDeadline.getTime()) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionCursoFechas,
      message: "fechaDesbloqueo no puede ser posterior a fechaDeadline.",
      details: { campo: "fechaDesbloqueo" },
    })
  }
  return rawFd
}

function recalcularFechasSiAplica(
  input: ActualizarCursoInput,
  actual: {
    readonly fechaInicio: Date
    readonly fechaDeadline: Date
    readonly fechaDesbloqueo: Date | null
    readonly desbloqueo: DesbloqueoValor
  },
): FechaResuelta | null {
  const necesita =
    input.fechaInicio !== undefined ||
    input.fechaDeadline !== undefined ||
    input.fechaDesbloqueo !== undefined ||
    input.desbloqueo !== undefined
  if (!necesita) {
    return null
  }
  return resolverFechas(
    {
      fechaInicio: input.fechaInicio,
      fechaDeadline: input.fechaDeadline,
      fechaDesbloqueo: input.fechaDesbloqueo,
      desbloqueo: input.desbloqueo,
    },
    actual,
  )
}

function construirFiltrosListarBase(query: ListarCursosQuery): Prisma.CursoWhereInput[] {
  const filtros: Prisma.CursoWhereInput[] = []
  if (query.estado) {
    filtros.push({ estado: query.estado })
  }
  if (query.q) {
    filtros.push({ titulo: { contains: query.q, mode: "insensitive" } })
  }
  if (query.fechaDeadlineDesde || query.fechaDeadlineHasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.fechaDeadlineDesde) {
      // biome-ignore lint/nursery/noSecrets: nombre de campo (alta entropía falso positivo).
      rango.gte = parseYmd(query.fechaDeadlineDesde, "fechaDeadlineDesde")
    }
    if (query.fechaDeadlineHasta) {
      // biome-ignore lint/nursery/noSecrets: nombre de campo (alta entropía falso positivo).
      rango.lte = parseYmd(query.fechaDeadlineHasta, "fechaDeadlineHasta")
    }
    filtros.push({ fechaDeadline: rango })
  }
  return filtros
}

interface ModuloHabilitadoFuente {
  readonly moduloId: string
  readonly modulo: { readonly id: string; readonly titulo: string; readonly estado: EstadoModulo }
}

function clasificarModulosDuplicado(modulosHabilitados: readonly ModuloHabilitadoFuente[]): {
  readonly modulosArchivados: readonly ModuloHabilitadoFuente[]
  readonly modulosCopiables: readonly ModuloHabilitadoFuente[]
} {
  const modulosArchivados: ModuloHabilitadoFuente[] = []
  const modulosCopiables: ModuloHabilitadoFuente[] = []
  for (const m of modulosHabilitados) {
    if (m.modulo.estado === EstadoModulo.ARCHIVADO) {
      modulosArchivados.push(m)
    } else {
      modulosCopiables.push(m)
    }
  }
  return { modulosArchivados, modulosCopiables }
}

async function copiarSubRecursosCurso(
  tx: Prisma.TransactionClient,
  cursoDestinoId: string,
  fuente: {
    readonly areasExigidas: readonly {
      readonly areaId: string
      readonly peso: Prisma.Decimal
      readonly puntajeObjetivo: Prisma.Decimal
    }[]
    readonly skillsExigidas: readonly {
      readonly skillId: string
      readonly notaMinima: Prisma.Decimal
    }[]
    readonly modulosCopiables: readonly ModuloHabilitadoFuente[]
  },
): Promise<void> {
  if (fuente.areasExigidas.length > 0) {
    await tx.cursoAreaExigida.createMany({
      data: fuente.areasExigidas.map((a) => ({
        cursoId: cursoDestinoId,
        areaId: a.areaId,
        peso: a.peso,
        puntajeObjetivo: a.puntajeObjetivo,
      })),
    })
  }
  if (fuente.skillsExigidas.length > 0) {
    await tx.cursoSkillExigida.createMany({
      data: fuente.skillsExigidas.map((s) => ({
        cursoId: cursoDestinoId,
        skillId: s.skillId,
        notaMinima: s.notaMinima,
      })),
    })
  }
  if (fuente.modulosCopiables.length > 0) {
    await tx.cursoModuloHabilitado.createMany({
      data: fuente.modulosCopiables.map((m) => ({
        cursoId: cursoDestinoId,
        moduloId: m.moduloId,
      })),
    })
  }
}

/**
 * Construye el `data` de Prisma para PATCH /cursos/:id a partir del input
 * (campos opcionales) y, si las fechas se reevaluaron, sus valores resueltos.
 * Se extrae como funcion pura para mantener la complejidad del metodo
 * `actualizar` dentro de los limites del lint (D-CUR-12).
 */
function construirActualizarData(
  input: ActualizarCursoInput,
  fechas: FechaResuelta | null,
): Prisma.CursoUpdateInput {
  const data: Prisma.CursoUpdateInput = {}
  if (input.titulo !== undefined) {
    data.titulo = input.titulo
  }
  if (input.clienteId !== undefined) {
    data.cliente = { connect: { id: input.clienteId } }
  }
  if (input.toggleVoluntarios !== undefined) {
    data.toggleVoluntarios = input.toggleVoluntarios
  }
  if (input.toggleCierreAutomatico !== undefined) {
    data.toggleCierreAutomatico = input.toggleCierreAutomatico
  }
  if (input.umbralNoCumple !== undefined) {
    data.umbralNoCumple = input.umbralNoCumple
  }
  if (input.pesoBloques !== undefined) {
    data.pesoBloques = input.pesoBloques
  }
  if (input.pesoTransversal !== undefined) {
    data.pesoTransversal = input.pesoTransversal
  }
  if (input.pesoEntrevista !== undefined) {
    data.pesoEntrevista = input.pesoEntrevista
  }
  if (input.desbloqueo !== undefined) {
    data.desbloqueo = input.desbloqueo
  }
  if (fechas) {
    data.fechaInicio = fechas.fechaInicio
    data.fechaDeadline = fechas.fechaDeadline
    data.fechaDesbloqueo = fechas.fechaDesbloqueo
  }
  return data
}

/**
 * Valida la coherencia de fechas (D-CUR-7). Lanza 422 con `details.campo` si
 * alguna restriccion se incumple. Normaliza `fechaDesbloqueo` a `null` cuando
 * `desbloqueo !== DESDE_FECHA`.
 */
function resolverFechas(input: ResolverFechasInput, actual?: ResolverFechasActual): FechaResuelta {
  const fechaInicio = input.fechaInicio
    ? parseYmd(input.fechaInicio, "fechaInicio")
    : (actual?.fechaInicio ?? null)
  const fechaDeadline = input.fechaDeadline
    ? parseYmd(input.fechaDeadline, "fechaDeadline")
    : (actual?.fechaDeadline ?? null)
  if (!(fechaInicio && fechaDeadline)) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionCursoFechas,
      message: "Las fechas fechaInicio y fechaDeadline son obligatorias.",
      details: { campo: "fechas" },
    })
  }
  if (fechaInicio.getTime() >= fechaDeadline.getTime()) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionCursoFechas,
      message: "fechaInicio debe ser anterior a fechaDeadline.",
      details: { campo: "fechaInicio" },
    })
  }
  const desbloqueo = input.desbloqueo ?? actual?.desbloqueo ?? "ENCADENADO"
  const fechaDesbloqueo = resolverFechaDesbloqueo(input, actual, desbloqueo, fechaDeadline)
  return { fechaInicio, fechaDeadline, fechaDesbloqueo }
}

@Injectable()
export class CursosService {
  private readonly logger = new Logger(CursosService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * D-CUR-13: ADMIN ve todo (con `incluirArchivados` explicito); PARTICIPANTE
   * solo cursos donde tiene asignacion o donde `estado=ACTIVO &&
   * toggleVoluntarios=true`.
   */
  async listar(query: ListarCursosQuery, usuario: SesionUsuario): Promise<Paginated<CursoResumen>> {
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where = await this.buildListarWhere(query, usuario)

    const orderBy: Prisma.CursoOrderByWithRelationInput =
      query.sort === "fechaDeadline"
        ? { fechaDeadline: "asc" }
        : query.sort === "titulo"
          ? { titulo: "asc" }
          : { createdAt: "desc" }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.curso.findMany({
        where,
        select: SELECT_CURSO_RESUMEN_FIELDS,
        orderBy,
        take,
        skip,
      }),
      this.prisma.curso.count({ where }),
    ])
    return buildPaginatedResponse(filas.map(toCursoResumen), total, page, pageSize)
  }

  private async buildListarWhere(
    query: ListarCursosQuery,
    usuario: SesionUsuario,
  ): Promise<Prisma.CursoWhereInput> {
    const filtros: Prisma.CursoWhereInput[] = construirFiltrosListarBase(query)
    if (usuario.rol === RolUsuario.ADMIN) {
      this.aplicarFiltrosAdmin(filtros, query)
      // biome-ignore lint/style/useNamingConvention: claves Prisma (AND) son convención del cliente.
      return filtros.length > 0 ? { AND: filtros } : {}
    }
    await this.aplicarScopeParticipante(filtros, usuario)
    // biome-ignore lint/style/useNamingConvention: claves Prisma (AND) son convención del cliente.
    return { AND: filtros }
  }

  private aplicarFiltrosAdmin(filtros: Prisma.CursoWhereInput[], query: ListarCursosQuery): void {
    if (query.clienteId) {
      filtros.push({ clienteId: query.clienteId })
    }
    if (!(query.incluirArchivados || query.estado)) {
      filtros.push({ estado: { not: EstadoCurso.ARCHIVADO } })
    }
  }

  private async aplicarScopeParticipante(
    filtros: Prisma.CursoWhereInput[],
    usuario: SesionUsuario,
  ): Promise<void> {
    const usuarioDb = await this.prisma.usuario.findUnique({
      where: { id: usuario.usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuarioDb) {
      throw new ForbiddenException({
        code: apiErrorCodes.prohibido,
        message: "Identidad de usuario inválida.",
      })
    }
    filtros.push({
      // biome-ignore lint/style/useNamingConvention: claves Prisma (OR/AND) son convención del cliente.
      OR: [
        { asignaciones: { some: { colaboradorId: usuarioDb.colaboradorId } } },
        // biome-ignore lint/style/useNamingConvention: claves Prisma (AND) son convención del cliente.
        { AND: [{ estado: EstadoCurso.ACTIVO }, { toggleVoluntarios: true }] },
      ],
    })
  }

  private async leerCursoParaActualizar(tx: Prisma.TransactionClient, cursoId: string) {
    const actual = await tx.curso.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        estado: true,
        fechaInicio: true,
        fechaDeadline: true,
        fechaDesbloqueo: true,
        desbloqueo: true,
      },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    if (actual.estado !== EstadoCurso.BORRADOR) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoEstado,
        message: "El curso no admite edición en su estado actual.",
        details: { estado: actual.estado },
      })
    }
    return actual
  }

  /**
   * D-CUR-4 preparado: en P4a solo BORRADOR es mutable y motivo NO requerido.
   * Cuando P4b habilite mutaciones en ACTIVO, esta rama lanza 422 MOTIVO_REQUERIDO
   * si el header falta. Mantenerlo aquí documenta el patrón.
   */
  private validarMotivoSegunEstado(estado: EstadoCurso, motivo: string | undefined): void {
    if (estado === EstadoCurso.BORRADOR) {
      return
    }
    if (motivo === undefined || motivo.length === 0) {
      throw new HttpException(
        {
          code: apiErrorCodes.motivoRequerido,
          message: "Se requiere X-Motivo para editar un curso fuera de BORRADOR.",
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }
  }

  /**
   * D-CUR-13: PARTICIPANTE solo puede leer cursos dentro de su scope.
   */
  async obtenerDetalle(cursoId: string, usuario: SesionUsuario): Promise<CursoDetalle> {
    const row = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: SELECT_CURSO_DETALLE_FIELDS,
    })
    if (!row) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    if (usuario.rol !== RolUsuario.ADMIN) {
      const visible = await this.cursoEsVisibleParaParticipante(cursoId, usuario.usuarioId, row)
      if (!visible) {
        // No revelar que el recurso existe — mismo 404 que cuando no existe.
        throw new NotFoundException({
          code: apiErrorCodes.cursoNoEncontrado,
          message: "Curso no encontrado.",
        })
      }
    }
    return toCursoDetalle(row)
  }

  private async cursoEsVisibleParaParticipante(
    cursoId: string,
    usuarioId: string,
    curso: { readonly estado: EstadoCurso; readonly toggleVoluntarios: boolean },
  ): Promise<boolean> {
    if (curso.estado === EstadoCurso.ACTIVO && curso.toggleVoluntarios) {
      return true
    }
    const usuarioDb = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuarioDb) {
      return false
    }
    const asignado = await this.prisma.asignacionCurso.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma (auto-generado del schema).
        colaboradorId_cursoId: { colaboradorId: usuarioDb.colaboradorId, cursoId },
      },
      select: { id: true },
    })
    return Boolean(asignado)
  }

  async crear(input: CrearCursoInput, autorUsuarioId: string): Promise<CursoDetalle> {
    const fechas = resolverFechas({
      fechaInicio: input.fechaInicio,
      fechaDeadline: input.fechaDeadline,
      fechaDesbloqueo: input.fechaDesbloqueo ?? null,
      desbloqueo: input.desbloqueo,
    })

    const detalle = await this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findFirst({
        where: { id: input.clienteId, deletedAt: null },
        select: { id: true },
      })
      if (!cliente) {
        throw new NotFoundException({
          code: apiErrorCodes.clienteNoEncontrado,
          message: "Cliente no encontrado.",
        })
      }
      const creado = await tx.curso.create({
        data: {
          titulo: input.titulo,
          clienteId: input.clienteId,
          fechaInicio: fechas.fechaInicio,
          fechaDeadline: fechas.fechaDeadline,
          toggleVoluntarios: input.toggleVoluntarios ?? true,
          toggleCierreAutomatico: input.toggleCierreAutomatico ?? false,
          umbralNoCumple: input.umbralNoCumple ?? 10,
          pesoBloques: input.pesoBloques ?? 70,
          pesoTransversal: input.pesoTransversal ?? 20,
          pesoEntrevista: input.pesoEntrevista ?? 10,
          desbloqueo: input.desbloqueo ?? "ENCADENADO",
          fechaDesbloqueo: fechas.fechaDesbloqueo,
          estado: EstadoCurso.BORRADOR,
        },
        select: SELECT_CURSO_DETALLE_FIELDS,
      })
      await tx.logCambioCurso.create({
        data: {
          cursoId: creado.id,
          autorUsuarioId,
          accion: AccionLogCurso.OTRO,
          motivo: "Creación",
          previewImpacto: Prisma.JsonNull,
        },
      })
      return creado
    })

    this.logger.log(`Curso creado id=${detalle.id} estado=${detalle.estado}`)
    return toCursoDetalle(detalle)
  }

  /**
   * P4a: solo BORRADOR es mutable. ACTIVO/CERRADO/ARCHIVADO devuelven 409.
   * Se conserva la rama de motivo condicional D-CUR-4 (preparada para P4b)
   * dentro del propio `$transaction` releyendo el estado.
   */
  async actualizar(
    cursoId: string,
    input: ActualizarCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoDetalle> {
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaActualizar(tx, cursoId)
      this.validarMotivoSegunEstado(actual.estado, motivo)
      const fechas = recalcularFechasSiAplica(input, actual)
      await this.validarClienteDestino(tx, input.clienteId)
      const data = construirActualizarData(input, fechas)
      if (input.previewSolo === true) {
        // No persistimos: devolvemos el curso actual con detalle (D-CUR-12).
        return await tx.curso.findUniqueOrThrow({
          where: { id: cursoId },
          select: SELECT_CURSO_DETALLE_FIELDS,
        })
      }
      const { count } = await tx.curso.updateMany({
        where: { id: cursoId, estado: EstadoCurso.BORRADOR },
        data,
      })
      if (count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictCursoEstado,
          message: "El curso cambio de estado durante la operacion.",
        })
      }
      const actualizado = await tx.curso.findUniqueOrThrow({
        where: { id: cursoId },
        select: SELECT_CURSO_DETALLE_FIELDS,
      })
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.OTRO,
          motivo: motivo && motivo.length > 0 ? motivo : "Edición",
          previewImpacto: Prisma.JsonNull,
        },
      })
      return actualizado
    })

    return toCursoDetalle(detalle)
  }

  async eliminar(cursoId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const actual = await tx.curso.findUnique({
        where: { id: cursoId },
        select: { id: true, estado: true },
      })
      if (!actual) {
        throw new NotFoundException({
          code: apiErrorCodes.cursoNoEncontrado,
          message: "Curso no encontrado.",
        })
      }
      if (actual.estado !== EstadoCurso.BORRADOR) {
        throw new ConflictException({
          code: apiErrorCodes.conflictCursoNoBorrador,
          message: "Solo se pueden eliminar cursos en estado BORRADOR.",
          details: { estado: actual.estado },
        })
      }
      // LogCambioCurso desaparece por onDelete: Restrict, pero como BORRADOR
      // solo tiene un log de "Creación" del sistema, lo eliminamos primero.
      await tx.logCambioCurso.deleteMany({ where: { cursoId } })
      await tx.curso.delete({ where: { id: cursoId } })
    })
    this.logger.log(`Curso eliminado id=${cursoId}`)
  }

  async archivar(cursoId: string, motivo: string, autorUsuarioId: string): Promise<CursoDetalle> {
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await tx.curso.findUnique({
        where: { id: cursoId },
        select: { id: true, estado: true },
      })
      if (!actual) {
        throw new NotFoundException({
          code: apiErrorCodes.cursoNoEncontrado,
          message: "Curso no encontrado.",
        })
      }
      if (actual.estado !== EstadoCurso.CERRADO) {
        throw new ConflictException({
          code: apiErrorCodes.conflictCursoNoCerrado,
          message: "Solo se pueden archivar cursos en estado CERRADO.",
          details: { estado: actual.estado },
        })
      }
      // Patron M1 race-safe (FIX-P4-cierre §5.39): el guard `estado=CERRADO`
      // viaja al WHERE para que dos writers concurrentes no actualicen el
      // mismo registro y produzcan dos logs.
      const { count } = await tx.curso.updateMany({
        where: { id: cursoId, estado: EstadoCurso.CERRADO },
        data: { estado: EstadoCurso.ARCHIVADO },
      })
      if (count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictCursoEstado,
          message: "El curso cambio de estado durante la operacion.",
        })
      }
      const actualizado = await tx.curso.findUniqueOrThrow({
        where: { id: cursoId },
        select: SELECT_CURSO_DETALLE_FIELDS,
      })
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.ARCHIVADO,
          motivo,
          previewImpacto: Prisma.JsonNull,
        },
      })
      return actualizado
    })
    return toCursoDetalle(detalle)
  }

  async desarchivar(cursoId: string, autorUsuarioId: string): Promise<CursoDetalle> {
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await tx.curso.findUnique({
        where: { id: cursoId },
        select: { id: true, estado: true },
      })
      if (!actual) {
        throw new NotFoundException({
          code: apiErrorCodes.cursoNoEncontrado,
          message: "Curso no encontrado.",
        })
      }
      if (actual.estado !== EstadoCurso.ARCHIVADO) {
        throw new ConflictException({
          code: apiErrorCodes.conflictCursoNoArchivado,
          message: "Solo se pueden desarchivar cursos en estado ARCHIVADO.",
          details: { estado: actual.estado },
        })
      }
      const { count } = await tx.curso.updateMany({
        where: { id: cursoId, estado: EstadoCurso.ARCHIVADO },
        data: { estado: EstadoCurso.CERRADO },
      })
      if (count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictCursoEstado,
          message: "El curso cambio de estado durante la operacion.",
        })
      }
      const actualizado = await tx.curso.findUniqueOrThrow({
        where: { id: cursoId },
        select: SELECT_CURSO_DETALLE_FIELDS,
      })
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.OTRO,
          motivo: "Desarchivado",
          previewImpacto: Prisma.JsonNull,
        },
      })
      return actualizado
    })
    return toCursoDetalle(detalle)
  }

  /**
   * D-CUR-10: copia configuracion del curso fuente excluyendo modulos en
   * estado ARCHIVADO. Si TODOS los modulos del fuente estan archivados, se
   * rechaza con 409 (el destino quedaria sin modulos y no seria publicable).
   */
  async duplicar(
    cursoFuenteId: string,
    input: DuplicarCursoInput,
    motivo: string,
    autorUsuarioId: string,
  ): Promise<DuplicarCursoResponse> {
    const resultado = await this.prisma.$transaction(async (tx) => {
      const fuente = await this.leerCursoFuente(tx, cursoFuenteId)
      await this.validarClienteDestino(tx, input.clienteId)
      const { modulosArchivados, modulosCopiables } = clasificarModulosDuplicado(
        fuente.modulosHabilitados,
      )
      if (fuente.modulosHabilitados.length > 0 && modulosCopiables.length === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictModuloArchivadoNoDuplicable,
          message: "No se puede duplicar el curso: todos los módulos habilitados están archivados.",
          details: {
            modulosExcluidos: modulosArchivados.map((m) => ({
              moduloId: m.modulo.id,
              titulo: m.modulo.titulo,
            })),
          },
        })
      }
      const clienteDestinoId = input.clienteId ?? fuente.clienteId
      const creado = await tx.curso.create({
        data: {
          titulo: input.tituloNuevo,
          clienteId: clienteDestinoId,
          fechaInicio: fuente.fechaInicio,
          fechaDeadline: fuente.fechaDeadline,
          toggleVoluntarios: fuente.toggleVoluntarios,
          toggleCierreAutomatico: fuente.toggleCierreAutomatico,
          umbralNoCumple: fuente.umbralNoCumple,
          pesoBloques: fuente.pesoBloques,
          pesoTransversal: fuente.pesoTransversal,
          pesoEntrevista: fuente.pesoEntrevista,
          desbloqueo: fuente.desbloqueo,
          fechaDesbloqueo: fuente.fechaDesbloqueo,
          estado: EstadoCurso.BORRADOR,
        },
        select: { id: true },
      })
      await copiarSubRecursosCurso(tx, creado.id, {
        areasExigidas: fuente.areasExigidas,
        skillsExigidas: fuente.skillsExigidas,
        modulosCopiables,
      })
      const modulosExcluidos = modulosArchivados.map((m) => ({
        moduloId: m.modulo.id,
        titulo: m.modulo.titulo,
      }))
      const previewImpacto: Prisma.InputJsonValue = {
        fuente: cursoFuenteId,
        modulosExcluidos,
      }
      await tx.logCambioCurso.create({
        data: {
          cursoId: creado.id,
          autorUsuarioId,
          accion: AccionLogCurso.OTRO,
          motivo: motivo && motivo.length > 0 ? motivo : `Duplicado desde curso ${cursoFuenteId}`,
          previewImpacto,
        },
      })
      const detalle = await tx.curso.findUniqueOrThrow({
        where: { id: creado.id },
        select: SELECT_CURSO_DETALLE_FIELDS,
      })
      return { detalle, modulosExcluidos }
    })

    return {
      curso: toCursoDetalle(resultado.detalle),
      modulosExcluidos: resultado.modulosExcluidos,
    }
  }

  private async leerCursoFuente(tx: Prisma.TransactionClient, cursoFuenteId: string) {
    const fuente = await tx.curso.findUnique({
      where: { id: cursoFuenteId },
      select: {
        id: true,
        clienteId: true,
        fechaInicio: true,
        fechaDeadline: true,
        toggleVoluntarios: true,
        toggleCierreAutomatico: true,
        umbralNoCumple: true,
        pesoBloques: true,
        pesoTransversal: true,
        pesoEntrevista: true,
        desbloqueo: true,
        fechaDesbloqueo: true,
        areasExigidas: { select: { areaId: true, peso: true, puntajeObjetivo: true } },
        skillsExigidas: { select: { skillId: true, notaMinima: true } },
        modulosHabilitados: {
          select: {
            moduloId: true,
            modulo: { select: { id: true, titulo: true, estado: true } },
          },
        },
      },
    })
    if (!fuente) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso fuente no encontrado.",
      })
    }
    return fuente
  }

  private async validarClienteDestino(
    tx: Prisma.TransactionClient,
    clienteId: string | undefined,
  ): Promise<void> {
    if (!clienteId) {
      return
    }
    const cliente = await tx.cliente.findFirst({
      where: { id: clienteId, deletedAt: null },
      select: { id: true },
    })
    if (!cliente) {
      throw new NotFoundException({
        code: apiErrorCodes.clienteNoEncontrado,
        message: "Cliente destino no encontrado.",
      })
    }
  }

  async listarLogCambios(
    cursoId: string,
    query: ListarLogCambiosQuery,
  ): Promise<Paginated<LogCambioCursoDto>> {
    const cursoExiste = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!cursoExiste) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.LogCambioCursoWhereInput = { cursoId }
    if (query.accion) {
      where.accion = query.accion
    }
    if (query.desde || query.hasta) {
      const rango: Prisma.DateTimeFilter = {}
      if (query.desde) {
        rango.gte = new Date(query.desde)
      }
      if (query.hasta) {
        rango.lte = new Date(query.hasta)
      }
      where.fecha = rango
    }
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.logCambioCurso.findMany({
        where,
        select: SELECT_LOG_CAMBIO_FIELDS,
        orderBy: { fecha: "desc" },
        take,
        skip,
      }),
      this.prisma.logCambioCurso.count({ where }),
    ])
    return buildPaginatedResponse(filas.map(toLogCambio), total, page, pageSize)
  }

  // ===========================================================================
  // P4b — Configuracion del curso (7 endpoints, D-CUR-3..11)
  // ===========================================================================

  /**
   * Lee el curso dentro del `tx` con estado, sub-tablas relevantes y pesos.
   * Verifica que existe, que el estado admite configuracion (BORRADOR o ACTIVO,
   * D-CUR-4) y que el motivo este presente cuando el estado lo requiere.
   * Patron heredado: releer en `tx` (FIX-P3b §5.21, D-CUR-12).
   */
  private async leerCursoParaConfigurar(
    tx: Prisma.TransactionClient,
    cursoId: string,
    motivo: string | undefined,
  ): Promise<CursoDetalleRow> {
    const actual = await tx.curso.findUnique({
      where: { id: cursoId },
      select: SELECT_CURSO_DETALLE_FIELDS,
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    if (actual.estado !== EstadoCurso.BORRADOR && actual.estado !== EstadoCurso.ACTIVO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoEstado,
        message: "El curso no admite configuracion en su estado actual.",
        details: { estado: actual.estado },
      })
    }
    this.validarMotivoSegunEstado(actual.estado, motivo)
    return actual
  }

  /**
   * Lee la version final del curso (post-update) para construir el response
   * `CursoConfiguracionResponse`. Se llama dentro del mismo `$transaction`.
   * Si por concurrencia el curso ya no existe, lanzamos `NotFoundException`
   * tipada con `cursoNoEncontrado` en lugar del error generico de Prisma
   * (`P2025`) para que el filtro global devuelva el codigo de dominio.
   */
  private async releerCursoDetalle(
    tx: Prisma.TransactionClient,
    cursoId: string,
  ): Promise<CursoDetalleRow> {
    const detalle = await tx.curso.findUnique({
      where: { id: cursoId },
      select: SELECT_CURSO_DETALLE_FIELDS,
    })
    if (!detalle) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    return detalle
  }

  /**
   * Texto a persistir en `LogCambioCurso.motivo` cuando el header `X-Motivo`
   * no fue obligatorio (estado BORRADOR). Garantiza NOT NULL del campo.
   */
  private resolverMotivoLog(motivo: string | undefined, etiqueta: string): string {
    return motivo && motivo.length > 0 ? motivo : etiqueta
  }

  /**
   * Endpoint 1/7 — PATCH /api/v1/cursos/:id/areas. D34: suma de pesos = 100;
   * cada `puntajeObjetivo` en [0,100] (ya validado por Zod).
   * Diff aEliminar/aAgregar/aActualizar para idempotencia (D-CUR-6).
   */
  async actualizarAreas(
    cursoId: string,
    input: ActualizarAreasCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoConfiguracionResponse> {
    validarSumaPesosCien(
      input.areas.map((a) => a.peso),
      "AREAS",
    )
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaConfigurar(tx, cursoId, motivo)
      const enInput = new Map(input.areas.map((a) => [a.areaId, a]))
      const enBd = new Map(
        actual.areasExigidas.map((a) => [
          a.areaId,
          { peso: Number(a.peso), puntajeObjetivo: Number(a.puntajeObjetivo) },
        ]),
      )
      const diff = calcularDiffComposite(new Set(enBd.keys()), new Set(enInput.keys()))
      if (diff.aEliminar.length > 0) {
        await tx.cursoAreaExigida.deleteMany({
          where: { cursoId, areaId: { in: [...diff.aEliminar] } },
        })
      }
      if (diff.aAgregar.length > 0) {
        await tx.cursoAreaExigida.createMany({
          data: diff.aAgregar.map((areaId) => {
            const dto = enInput.get(areaId)
            if (!dto) {
              throw diffInconsistenteError()
            }
            return {
              cursoId,
              areaId,
              peso: dto.peso,
              puntajeObjetivo: dto.puntajeObjetivo,
            }
          }),
        })
      }
      for (const areaId of diff.interseccion) {
        const nuevo = enInput.get(areaId)
        const previo = enBd.get(areaId)
        if (!(nuevo && previo)) {
          continue
        }
        if (nuevo.peso !== previo.peso || nuevo.puntajeObjetivo !== previo.puntajeObjetivo) {
          await tx.cursoAreaExigida.update({
            where: {
              // biome-ignore lint/style/useNamingConvention: composite key Prisma.
              cursoId_areaId: { cursoId, areaId },
            },
            data: { peso: nuevo.peso, puntajeObjetivo: nuevo.puntajeObjetivo },
          })
        }
      }
      const previewImpacto: Prisma.InputJsonValue = {
        pesosAnteriores: actual.areasExigidas.map((a) => ({
          areaId: a.areaId,
          peso: Number(a.peso),
        })),
        pesosNuevos: input.areas.map((a) => ({ areaId: a.areaId, peso: a.peso })),
      }
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.CAMBIO_AREAS,
          motivo: this.resolverMotivoLog(motivo, "Configuracion areas"),
          previewImpacto,
        },
      })
      return this.releerCursoDetalle(tx, cursoId)
    })
    return { ...toCursoDetalle(detalle), umbralesLogro: parseUmbralesLogro(detalle.umbralesLogro) }
  }

  /**
   * Endpoint 2/7 — PATCH /api/v1/cursos/:id/skills-exigidas. D6, D63. D82 aqui
   * es solo aviso (no bloquea); se persiste en `previewImpacto` y se devuelve
   * en `skillsSinCobertura` para que el wizard lo muestre.
   */
  async actualizarSkillsExigidas(
    cursoId: string,
    input: ActualizarSkillsExigidasCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoConfiguracionResponse> {
    const resultado = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaConfigurar(tx, cursoId, motivo)
      const enInput = new Map(input.skills.map((s) => [s.skillId, s]))
      const enBd = new Map(
        actual.skillsExigidas.map((s) => [s.skillId, { notaMinima: Number(s.notaMinima) }]),
      )
      const diff = calcularDiffComposite(new Set(enBd.keys()), new Set(enInput.keys()))
      if (diff.aEliminar.length > 0) {
        await tx.cursoSkillExigida.deleteMany({
          where: { cursoId, skillId: { in: [...diff.aEliminar] } },
        })
      }
      if (diff.aAgregar.length > 0) {
        await tx.cursoSkillExigida.createMany({
          data: diff.aAgregar.map((skillId) => {
            const dto = enInput.get(skillId)
            if (!dto) {
              throw diffInconsistenteError()
            }
            return { cursoId, skillId, notaMinima: dto.notaMinima }
          }),
        })
      }
      for (const skillId of diff.interseccion) {
        const nuevo = enInput.get(skillId)
        const previo = enBd.get(skillId)
        if (!(nuevo && previo)) {
          continue
        }
        if (nuevo.notaMinima !== previo.notaMinima) {
          await tx.cursoSkillExigida.update({
            where: {
              // biome-ignore lint/style/useNamingConvention: composite key Prisma.
              cursoId_skillId: { cursoId, skillId },
            },
            data: { notaMinima: nuevo.notaMinima },
          })
        }
      }
      const skillsExigidasIds = input.skills.map((s) => s.skillId)
      const modulosHabilitadosIds = actual.modulosHabilitados.map((m) => m.moduloId)
      const skillsSinCobertura = await this.calcularSkillsSinCobertura(
        tx,
        skillsExigidasIds,
        modulosHabilitadosIds,
      )
      const previewImpacto: Prisma.InputJsonValue = {
        aEliminar: [...diff.aEliminar],
        aAgregar: [...diff.aAgregar],
        skillsSinCobertura: skillsSinCobertura.map((s) => s.skillId),
      }
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.CAMBIO_OBJETIVOS,
          motivo: this.resolverMotivoLog(motivo, "Configuracion skills exigidas"),
          previewImpacto,
        },
      })
      const detalle = await this.releerCursoDetalle(tx, cursoId)
      return { detalle, skillsSinCobertura }
    })
    const base = toCursoDetalle(resultado.detalle)
    if (resultado.skillsSinCobertura.length === 0) {
      return { ...base, umbralesLogro: parseUmbralesLogro(resultado.detalle.umbralesLogro) }
    }
    return {
      ...base,
      umbralesLogro: parseUmbralesLogro(resultado.detalle.umbralesLogro),
      skillsSinCobertura: resultado.skillsSinCobertura,
    }
  }

  /**
   * Endpoint 3/7 — PATCH /api/v1/cursos/:id/modulos-habilitados. D79 + D82.
   * Rechaza modulos ARCHIVADO siempre. En curso ACTIVO, rechaza si la
   * deshabilitacion dejaria una skill exigida sin cobertura.
   */
  async actualizarModulosHabilitados(
    cursoId: string,
    input: ActualizarModulosHabilitadosCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoConfiguracionResponse> {
    const resultado = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaConfigurar(tx, cursoId, motivo)
      await this.validarModulosNoArchivados(tx, input.moduloIds)
      const enBd = new Set(actual.modulosHabilitados.map((m) => m.moduloId))
      const enInput = new Set(input.moduloIds)
      const diff = calcularDiffComposite(enBd, enInput)
      const skillsExigidasIds = actual.skillsExigidas.map((s) => s.skillId)
      const skillsSinCobertura = await this.calcularSkillsSinCobertura(
        tx,
        skillsExigidasIds,
        input.moduloIds,
      )
      if (actual.estado === EstadoCurso.ACTIVO && skillsSinCobertura.length > 0) {
        throw new UnprocessableEntityException({
          code: apiErrorCodes.validacionSkillSinCobertura,
          message: "El cambio dejaria skills exigidas sin cobertura.",
          details: { skills: skillsSinCobertura },
        })
      }
      if (diff.aEliminar.length > 0) {
        await tx.cursoModuloHabilitado.deleteMany({
          where: { cursoId, moduloId: { in: [...diff.aEliminar] } },
        })
      }
      if (diff.aAgregar.length > 0) {
        await tx.cursoModuloHabilitado.createMany({
          data: diff.aAgregar.map((moduloId) => ({ cursoId, moduloId })),
        })
      }
      // Misma referencia para el log y para el response (H-9): evita drift
      // entre lo que se persiste en LogCambioCurso.previewImpacto y lo que
      // se devuelve al cliente.
      const previewImpacto = {
        aEliminar: [...diff.aEliminar],
        aAgregar: [...diff.aAgregar],
        skillsSinCobertura: skillsSinCobertura.map((s) => s.skillId),
      } satisfies Prisma.InputJsonValue
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.CAMBIO_MODULOS,
          motivo: this.resolverMotivoLog(motivo, "Configuracion modulos habilitados"),
          previewImpacto,
        },
      })
      const detalle = await this.releerCursoDetalle(tx, cursoId)
      return { detalle, skillsSinCobertura, previewImpacto }
    })
    const base = toCursoDetalle(resultado.detalle)
    if (resultado.skillsSinCobertura.length === 0) {
      return {
        ...base,
        umbralesLogro: parseUmbralesLogro(resultado.detalle.umbralesLogro),
        previewImpacto: resultado.previewImpacto,
      }
    }
    return {
      ...base,
      umbralesLogro: parseUmbralesLogro(resultado.detalle.umbralesLogro),
      previewImpacto: resultado.previewImpacto,
      skillsSinCobertura: resultado.skillsSinCobertura,
    }
  }

  /**
   * Endpoint 4/7 — PATCH /api/v1/cursos/:id/pesos. D33: bloques+transversal+
   * entrevista = 100. Si solo viene un subconjunto, se completa con los valores
   * actuales del curso antes de validar.
   */
  async actualizarPesos(
    cursoId: string,
    input: ActualizarPesosCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoConfiguracionResponse> {
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaConfigurar(tx, cursoId, motivo)
      const hayCambioDePeso =
        input.pesoBloques !== undefined ||
        input.pesoTransversal !== undefined ||
        input.pesoEntrevista !== undefined
      if (hayCambioDePeso) {
        validarSumaPesosCien(
          [
            input.pesoBloques ?? Number(actual.pesoBloques),
            input.pesoTransversal ?? Number(actual.pesoTransversal),
            input.pesoEntrevista ?? Number(actual.pesoEntrevista),
          ],
          "PESOS_INTRA_SKILL",
        )
      }
      // H-11: data y pesosNuevos comparten exactamente las mismas claves —
      // las presentes en input. pesosAnteriores se mantiene completo (snapshot).
      const pesosNuevos = construirPesosCambiados(input)
      await tx.curso.update({ where: { id: cursoId }, data: pesosNuevos })
      const previewImpacto: Prisma.InputJsonValue = {
        pesosAnteriores: {
          pesoBloques: Number(actual.pesoBloques),
          pesoTransversal: Number(actual.pesoTransversal),
          pesoEntrevista: Number(actual.pesoEntrevista),
          umbralNoCumple: Number(actual.umbralNoCumple),
        },
        pesosNuevos,
      }
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.CAMBIO_PESOS,
          motivo: this.resolverMotivoLog(motivo, "Configuracion pesos"),
          previewImpacto,
        },
      })
      return this.releerCursoDetalle(tx, cursoId)
    })
    return { ...toCursoDetalle(detalle), umbralesLogro: parseUmbralesLogro(detalle.umbralesLogro) }
  }

  /**
   * Endpoint 5/7 — PATCH /api/v1/cursos/:id/umbrales-logro. Cap. 10.5: override
   * por curso. `null` resetea a defaults del sistema. Monotonia
   * excelencia >= solido >= enDesarrollo.
   */
  async actualizarUmbralesLogro(
    cursoId: string,
    input: ActualizarUmbralesLogroCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoConfiguracionResponse> {
    if (input.umbralesLogro !== null) {
      validarMonotoniaUmbralesLogro(input.umbralesLogro)
    }
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaConfigurar(tx, cursoId, motivo)
      const valorPersistido: Prisma.InputJsonValue | typeof Prisma.JsonNull =
        input.umbralesLogro === null ? Prisma.JsonNull : input.umbralesLogro
      await tx.curso.update({
        where: { id: cursoId },
        data: { umbralesLogro: valorPersistido },
      })
      const previewImpacto: Prisma.InputJsonValue = {
        anterior: parseUmbralesLogro(actual.umbralesLogro),
        nuevo: input.umbralesLogro,
      }
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.OTRO,
          motivo: this.resolverMotivoLog(motivo, "Configuracion umbrales de logro"),
          previewImpacto,
        },
      })
      return this.releerCursoDetalle(tx, cursoId)
    })
    return { ...toCursoDetalle(detalle), umbralesLogro: parseUmbralesLogro(detalle.umbralesLogro) }
  }

  /**
   * Endpoint 6/7 — PATCH /api/v1/cursos/:id/transversal. D-CUR-8 lazy:
   *  - activar sin existente → create + curso.transversalId.
   *  - activar con existente → update + diff TransversalSkill.
   *  - desactivar sin intentos → delete (Curso.transversalId queda null via SetNull).
   *  - desactivar con intentos → 409.
   * Cuando se aplica, la suma de pesos de capas debe ser 100 (D86).
   */
  async actualizarTransversal(
    cursoId: string,
    input: ActualizarTransversalCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoConfiguracionResponse> {
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaConfigurar(tx, cursoId, motivo)
      const transversalIdActual = actual.transversalId
      let activadoCambio: "ACTIVADO" | "DESACTIVADO" | "ACTUALIZADO" | "NINGUNO" = "NINGUNO"
      let creado = false

      if (input.activo) {
        const pesosFinal = await this.aplicarTransversalActivar(
          tx,
          cursoId,
          transversalIdActual,
          input,
        )
        creado = pesosFinal.creado
        activadoCambio = creado ? "ACTIVADO" : "ACTUALIZADO"
      } else if (transversalIdActual) {
        await this.aplicarTransversalDesactivar(tx, transversalIdActual)
        activadoCambio = "DESACTIVADO"
      }

      const previewImpacto: Prisma.InputJsonValue = { creado, activadoCambio }
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.TOGGLE_TRANSVERSAL,
          motivo: this.resolverMotivoLog(motivo, "Configuracion transversal"),
          previewImpacto,
        },
      })
      return this.releerCursoDetalle(tx, cursoId)
    })
    return { ...toCursoDetalle(detalle), umbralesLogro: parseUmbralesLogro(detalle.umbralesLogro) }
  }

  private async aplicarTransversalActivar(
    tx: Prisma.TransactionClient,
    cursoId: string,
    transversalIdActual: string | null,
    input: ActualizarTransversalCursoInput,
  ): Promise<{ readonly creado: boolean }> {
    validarPesosCapasTransversalSiAplica(input)
    if (transversalIdActual === null) {
      await this.crearTransversal(tx, cursoId, input)
      return { creado: true }
    }
    await this.actualizarTransversalExistente(tx, transversalIdActual, input)
    return { creado: false }
  }

  private async crearTransversal(
    tx: Prisma.TransactionClient,
    cursoId: string,
    input: ActualizarTransversalCursoInput,
  ): Promise<void> {
    const creado = await tx.proyectoTransversal.create({
      data: {
        cursoId,
        descripcion: input.descripcion ?? "",
        umbralAprobacion: input.umbralAprobacion ?? 70,
        pesoCapaTests: input.pesoCapaTests ?? 40,
        pesoCapaCualitativa: input.pesoCapaCualitativa ?? 30,
        pesoCapaComprension: input.pesoCapaComprension ?? 30,
        capaTestsActiva: input.capaTestsActiva ?? true,
        capaCualitativaActiva: input.capaCualitativaActiva ?? true,
        capaComprensionActiva: input.capaComprensionActiva ?? true,
      },
      select: { id: true },
    })
    await tx.curso.update({
      where: { id: cursoId },
      data: { transversalId: creado.id },
    })
    if (input.skillsQueMideIds && input.skillsQueMideIds.length > 0) {
      await tx.transversalSkill.createMany({
        data: input.skillsQueMideIds.map((skillId) => ({ transversalId: creado.id, skillId })),
      })
    }
  }

  private async actualizarTransversalExistente(
    tx: Prisma.TransactionClient,
    transversalId: string,
    input: ActualizarTransversalCursoInput,
  ): Promise<void> {
    await tx.proyectoTransversal.update({
      where: { id: transversalId },
      data: construirDataUpdateTransversal(input),
    })
    if (input.skillsQueMideIds) {
      await this.aplicarDiffTransversalSkills(tx, transversalId, input.skillsQueMideIds)
    }
  }

  private async aplicarDiffTransversalSkills(
    tx: Prisma.TransactionClient,
    transversalId: string,
    skillsObjetivo: readonly string[],
  ): Promise<void> {
    const actuales = await tx.transversalSkill.findMany({
      where: { transversalId },
      select: { skillId: true },
    })
    const diff = calcularDiffComposite(
      new Set(actuales.map((s) => s.skillId)),
      new Set(skillsObjetivo),
    )
    if (diff.aEliminar.length > 0) {
      await tx.transversalSkill.deleteMany({
        where: { transversalId, skillId: { in: [...diff.aEliminar] } },
      })
    }
    if (diff.aAgregar.length > 0) {
      await tx.transversalSkill.createMany({
        data: diff.aAgregar.map((skillId) => ({ transversalId, skillId })),
      })
    }
  }

  private async aplicarTransversalDesactivar(
    tx: Prisma.TransactionClient,
    transversalId: string,
  ): Promise<void> {
    const intentos = await tx.intentoTransversal.count({ where: { transversalId } })
    if (intentos > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictTransversalConIntentos,
        message: "No se puede desactivar el transversal: ya tiene intentos registrados.",
        details: { intentos },
      })
    }
    // Cascade en TransversalSkill; Curso.transversalId queda null via SetNull.
    await tx.proyectoTransversal.delete({ where: { id: transversalId } })
  }

  /**
   * Endpoint 7/7 — PATCH /api/v1/cursos/:id/entrevista-ia. D-CUR-8 lazy.
   * Reglas: suma rubrica=100, duracion ∈ {15,30,45}, 409 si tiene intentos.
   */
  async actualizarEntrevistaIa(
    cursoId: string,
    input: ActualizarEntrevistaIaCursoInput,
    motivo: string | undefined,
    autorUsuarioId: string,
  ): Promise<CursoConfiguracionResponse> {
    if (input.duracionMinutos !== undefined) {
      validarDuracionEntrevistaIa(input.duracionMinutos)
    }
    if (input.rubrica && input.rubrica.length > 0) {
      validarSumaPesosCien(
        input.rubrica.map((r) => r.peso),
        "RUBRICA_ENTREVISTA",
      )
    }
    const detalle = await this.prisma.$transaction(async (tx) => {
      const actual = await this.leerCursoParaConfigurar(tx, cursoId, motivo)
      const entrevistaIaIdActual = actual.entrevistaIaId
      let creado = false
      let activadoCambio: "ACTIVADO" | "DESACTIVADO" | "ACTUALIZADO" | "NINGUNO" = "NINGUNO"

      if (input.activo) {
        const r = await this.aplicarEntrevistaIaActivar(tx, cursoId, entrevistaIaIdActual, input)
        creado = r.creado
        activadoCambio = creado ? "ACTIVADO" : "ACTUALIZADO"
      } else if (entrevistaIaIdActual) {
        await this.aplicarEntrevistaIaDesactivar(tx, entrevistaIaIdActual)
        activadoCambio = "DESACTIVADO"
      }

      const previewImpacto: Prisma.InputJsonValue = { creado, activadoCambio }
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.TOGGLE_ENTREVISTA,
          motivo: this.resolverMotivoLog(motivo, "Configuracion entrevista IA"),
          previewImpacto,
        },
      })
      return this.releerCursoDetalle(tx, cursoId)
    })
    return { ...toCursoDetalle(detalle), umbralesLogro: parseUmbralesLogro(detalle.umbralesLogro) }
  }

  private async aplicarEntrevistaIaActivar(
    tx: Prisma.TransactionClient,
    cursoId: string,
    entrevistaIaIdActual: string | null,
    input: ActualizarEntrevistaIaCursoInput,
  ): Promise<{ readonly creado: boolean }> {
    if (entrevistaIaIdActual === null) {
      await this.crearEntrevistaIa(tx, cursoId, input)
      return { creado: true }
    }
    await this.actualizarEntrevistaIaExistente(tx, entrevistaIaIdActual, input)
    return { creado: false }
  }

  private async crearEntrevistaIa(
    tx: Prisma.TransactionClient,
    cursoId: string,
    input: ActualizarEntrevistaIaCursoInput,
  ): Promise<void> {
    const creado = await tx.entrevistaIA.create({
      data: {
        cursoId,
        umbralAprobacion: input.umbralAprobacion ?? 70,
        filosofia: input.filosofia ?? "PREPARACION",
        profundidad: input.profundidad ?? "SEMI_SENIOR",
        duracionMinutos: input.duracionMinutos ?? 30,
        tono: input.tono ?? "CONVERSACIONAL",
      },
      select: { id: true },
    })
    await tx.curso.update({
      where: { id: cursoId },
      data: { entrevistaIaId: creado.id },
    })
    if (input.rubrica && input.rubrica.length > 0) {
      await tx.rubricaEntrevistaIA.createMany({
        data: input.rubrica.map((r) => ({
          entrevistaIaId: creado.id,
          areaId: r.areaId,
          peso: r.peso,
        })),
      })
    }
  }

  private async actualizarEntrevistaIaExistente(
    tx: Prisma.TransactionClient,
    entrevistaIaId: string,
    input: ActualizarEntrevistaIaCursoInput,
  ): Promise<void> {
    await tx.entrevistaIA.update({
      where: { id: entrevistaIaId },
      data: construirDataUpdateEntrevistaIa(input),
    })
    if (input.rubrica) {
      await this.aplicarDiffRubricaEntrevista(tx, entrevistaIaId, input.rubrica)
    }
  }

  private async aplicarDiffRubricaEntrevista(
    tx: Prisma.TransactionClient,
    entrevistaIaId: string,
    rubrica: readonly { readonly areaId: string; readonly peso: number }[],
  ): Promise<void> {
    const actuales = await tx.rubricaEntrevistaIA.findMany({
      where: { entrevistaIaId },
      select: { areaId: true, peso: true },
    })
    const enInput = new Map(rubrica.map((r) => [r.areaId, r.peso]))
    const enBd = new Map(actuales.map((a) => [a.areaId, Number(a.peso)]))
    const diff = calcularDiffComposite(new Set(enBd.keys()), new Set(enInput.keys()))
    if (diff.aEliminar.length > 0) {
      await tx.rubricaEntrevistaIA.deleteMany({
        where: { entrevistaIaId, areaId: { in: [...diff.aEliminar] } },
      })
    }
    if (diff.aAgregar.length > 0) {
      await tx.rubricaEntrevistaIA.createMany({
        data: diff.aAgregar.map((areaId) => {
          const peso = enInput.get(areaId)
          if (peso === undefined) {
            throw diffInconsistenteError()
          }
          return { entrevistaIaId, areaId, peso }
        }),
      })
    }
    for (const areaId of diff.interseccion) {
      const pesoNuevo = enInput.get(areaId)
      const pesoPrevio = enBd.get(areaId)
      if (pesoNuevo === undefined || pesoPrevio === undefined) {
        continue
      }
      if (pesoNuevo !== pesoPrevio) {
        await tx.rubricaEntrevistaIA.update({
          where: {
            // biome-ignore lint/style/useNamingConvention: composite key Prisma.
            entrevistaIaId_areaId: { entrevistaIaId, areaId },
          },
          data: { peso: pesoNuevo },
        })
      }
    }
  }

  private async aplicarEntrevistaIaDesactivar(
    tx: Prisma.TransactionClient,
    entrevistaIaId: string,
  ): Promise<void> {
    const intentos = await tx.intentoEntrevistaIA.count({ where: { entrevistaIaId } })
    if (intentos > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictEntrevistaConIntentos,
        message: "No se puede desactivar la entrevista IA: ya tiene intentos registrados.",
        details: { intentos },
      })
    }
    await tx.entrevistaIA.delete({ where: { id: entrevistaIaId } })
  }

  /**
   * Rechaza modulos en estado ARCHIVADO antes de aplicar el set deseado (D79).
   * Tambien valida que todos los moduloIds existan: P2003 sobre la FK
   * sera capturado por PrismaExceptionFilter, pero un pre-check explicito
   * da mensaje accionable al cliente.
   */
  private async validarModulosNoArchivados(
    tx: Prisma.TransactionClient,
    moduloIds: readonly string[],
  ): Promise<void> {
    if (moduloIds.length === 0) {
      return
    }
    const modulos = await tx.modulo.findMany({
      where: { id: { in: [...moduloIds] } },
      select: { id: true, estado: true, titulo: true },
    })
    const archivados = modulos.filter((m) => m.estado === EstadoModulo.ARCHIVADO)
    if (archivados.length > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictModuloArchivadoNoHabilitable,
        message: "No se pueden habilitar modulos en estado ARCHIVADO.",
        details: {
          modulos: archivados.map((m) => ({ moduloId: m.id, titulo: m.titulo })),
        },
      })
    }
  }

  // ===========================================================================
  // P4c — Publicacion BORRADOR -> ACTIVO (D63, D-CUR-9)
  // ===========================================================================

  /**
   * Transicion BORRADOR -> ACTIVO. Releeer el curso dentro del `$transaction`
   * con todo lo necesario para validar D63 en una sola pasada (D-CUR-9 +
   * D-CUR-12). Idempotencia por estado: cualquier otro estado distinto de
   * BORRADOR rechaza con 409 `conflictCursoEstado`. Si alguna precondicion
   * D63 falla, 422 con `details.validacionesFallidas` recolectando TODAS
   * (sin early-exit) para que el admin pueda corregir en una edicion.
   *
   * El motivo es opcional (D-CUR-4, excepcion semantica positiva): si no
   * viene, el log persiste `"Publicacion"` por defecto. El `LogCambioCurso`
   * va DENTRO del mismo tx (D-CUR-3 audit dual). Si la transicion falla,
   * Prisma hace rollback automatico y no queda log fantasma.
   */
  async publicarCurso(
    cursoId: string,
    autorUsuarioId: string,
    motivo: string | undefined,
  ): Promise<CursoDetalle> {
    // Defensa interna por si publicarCurso se invoca desde otra capa sin pasar
    // por el decorator @Motivo (que ya hace trim + saneamiento Zod).
    const motivoFinal = motivo?.trim() ?? ""
    const detalle = await this.prisma.$transaction(async (tx) => {
      const snapshot = await this.leerSnapshotPublicacion(tx, cursoId)
      const resultado = validarPrecondicionesPublicacion(snapshot.curso)
      if (!resultado.ok) {
        throw new UnprocessableEntityException({
          code: apiErrorCodes.conflictCursoNoPublicable,
          message: "El curso no cumple las precondiciones para publicarse.",
          details: { validacionesFallidas: resultado.validacionesFallidas.map((v) => ({ ...v })) },
        })
      }
      // Race-safe transicion BORRADOR -> ACTIVO. Dos publicaciones concurrentes
      // que pasen el snapshot leyendo BORRADOR colisionaran aqui: solo una vera
      // count===1 y persistira el log; la otra recibira count===0 -> 409 y el
      // LogCambioCurso queda revertido por rollback del mismo $transaction.
      const { count } = await tx.curso.updateMany({
        where: { id: cursoId, estado: EstadoCurso.BORRADOR },
        data: { estado: EstadoCurso.ACTIVO },
      })
      if (count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictCursoEstado,
          message: "El curso ya no esta en estado BORRADOR.",
        })
      }
      await tx.logCambioCurso.create({
        data: {
          cursoId,
          autorUsuarioId,
          accion: AccionLogCurso.PUBLICACION,
          motivo: motivoFinal.length > 0 ? motivoFinal : "Publicación",
          previewImpacto: {
            estadoAnterior: EstadoCurso.BORRADOR,
            estadoNuevo: EstadoCurso.ACTIVO,
          } satisfies Prisma.InputJsonValue,
        },
      })
      return this.releerCursoDetalle(tx, cursoId)
    })
    return toCursoDetalle(detalle)
  }

  /**
   * Lectura unica dentro del tx que reune todos los datos necesarios para
   * validar las 8 precondiciones D63. Hace dos queries en el mismo tx para
   * no exceder los 2 niveles de include profundo (D-CUR-12):
   *  1) Curso con sub-relaciones directas (areas, skills exigidas, modulos
   *     habilitados, transversal con sus pesos, entrevistaIA con rubrica).
   *  2) Cobertura D82 via `calcularSkillsSinCobertura(tx, ...)`.
   */
  private async leerSnapshotPublicacion(
    tx: Prisma.TransactionClient,
    cursoId: string,
  ): Promise<{ readonly curso: CursoPublicacionSnapshot }> {
    const row = await tx.curso.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        estado: true,
        clienteId: true,
        fechaInicio: true,
        fechaDeadline: true,
        fechaDesbloqueo: true,
        desbloqueo: true,
        pesoBloques: true,
        pesoTransversal: true,
        pesoEntrevista: true,
        areasExigidas: {
          select: { areaId: true, peso: true, puntajeObjetivo: true },
        },
        skillsExigidas: { select: { skillId: true } },
        modulosHabilitados: { select: { moduloId: true } },
        transversal: {
          select: {
            umbralAprobacion: true,
            pesoCapaTests: true,
            pesoCapaCualitativa: true,
            pesoCapaComprension: true,
          },
        },
        entrevistaIA: {
          select: {
            umbralAprobacion: true,
            duracionMinutos: true,
            rubrica: { select: { areaId: true, peso: true } },
          },
        },
      },
    })
    if (!row) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    if (row.estado !== EstadoCurso.BORRADOR) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoEstado,
        message: "Solo se pueden publicar cursos en estado BORRADOR.",
        details: { estado: row.estado },
      })
    }
    const skillsExigidasIds = row.skillsExigidas.map((s) => s.skillId)
    const modulosHabilitadosIds = row.modulosHabilitados.map((m) => m.moduloId)
    const skillsSinCobertura = await this.calcularSkillsSinCobertura(
      tx,
      skillsExigidasIds,
      modulosHabilitadosIds,
    )
    const curso: CursoPublicacionSnapshot = {
      clienteId: row.clienteId,
      fechaInicio: row.fechaInicio,
      fechaDeadline: row.fechaDeadline,
      fechaDesbloqueo: row.fechaDesbloqueo,
      desbloqueo: row.desbloqueo,
      pesoBloques: row.pesoBloques,
      pesoTransversal: row.pesoTransversal,
      pesoEntrevista: row.pesoEntrevista,
      areasExigidas: row.areasExigidas,
      skillsExigidas: row.skillsExigidas,
      skillsSinCobertura,
      transversal: row.transversal,
      entrevistaIa: row.entrevistaIA,
    }
    return { curso }
  }

  /**
   * D82: dada una lista de skills exigidas y una lista de modulos habilitados,
   * devuelve las skills que no estan cubiertas por ningun modulo habilitado.
   * Cobertura = existe `SeccionSkill` para `skillId` con `seccion.moduloId`
   * dentro del set habilitado.
   */
  private async calcularSkillsSinCobertura(
    tx: Prisma.TransactionClient,
    skillsExigidasIds: readonly string[],
    modulosHabilitadosIds: readonly string[],
  ): Promise<SkillSinCobertura[]> {
    if (skillsExigidasIds.length === 0) {
      return []
    }
    const filas = await tx.seccionSkill.findMany({
      where: { skillId: { in: [...skillsExigidasIds] } },
      select: { skillId: true, seccion: { select: { moduloId: true } } },
    })
    const cobertura = new Map<string, Set<string>>()
    for (const f of filas) {
      const set = cobertura.get(f.skillId) ?? new Set<string>()
      set.add(f.seccion.moduloId)
      cobertura.set(f.skillId, set)
    }
    const habilitadosSet = new Set(modulosHabilitadosIds)
    const sinCobertura: string[] = []
    for (const skillId of skillsExigidasIds) {
      const modulosQueEnsenan = cobertura.get(skillId) ?? new Set<string>()
      const cubierta = [...modulosQueEnsenan].some((m) => habilitadosSet.has(m))
      if (!cubierta) {
        sinCobertura.push(skillId)
      }
    }
    if (sinCobertura.length === 0) {
      return []
    }
    const skills = await tx.skill.findMany({
      where: { id: { in: sinCobertura } },
      select: { id: true, etiquetaVisible: true },
    })
    return skills.map((s) => ({ skillId: s.id, etiquetaVisible: s.etiquetaVisible }))
  }
}

/**
 * Lanzador defensivo para ramas que TypeScript no puede excluir pero que en
 * runtime son inalcanzables (el diff garantiza que `aAgregar` ⊂ `enInput`).
 * Se prefiere a un `!` no checkeado para mantener "0 any" y trazabilidad.
 */
function diffInconsistenteError(): Error {
  return new Error("Estado inconsistente en diff composite: clave esperada no encontrada.")
}

function validarPesosCapasTransversalSiAplica(input: ActualizarTransversalCursoInput): void {
  const { pesoCapaTests, pesoCapaCualitativa, pesoCapaComprension } = input
  if (
    pesoCapaTests !== undefined &&
    pesoCapaCualitativa !== undefined &&
    pesoCapaComprension !== undefined
  ) {
    validarSumaPesosCien(
      [pesoCapaTests, pesoCapaCualitativa, pesoCapaComprension],
      "CAPAS_TRANSVERSAL",
    )
  }
}

function construirDataUpdateTransversal(
  input: ActualizarTransversalCursoInput,
): Prisma.ProyectoTransversalUpdateInput {
  const data: Prisma.ProyectoTransversalUpdateInput = {}
  if (input.descripcion !== undefined) {
    data.descripcion = input.descripcion
  }
  if (input.umbralAprobacion !== undefined) {
    data.umbralAprobacion = input.umbralAprobacion
  }
  if (input.pesoCapaTests !== undefined) {
    data.pesoCapaTests = input.pesoCapaTests
  }
  if (input.pesoCapaCualitativa !== undefined) {
    data.pesoCapaCualitativa = input.pesoCapaCualitativa
  }
  if (input.pesoCapaComprension !== undefined) {
    data.pesoCapaComprension = input.pesoCapaComprension
  }
  if (input.capaTestsActiva !== undefined) {
    data.capaTestsActiva = input.capaTestsActiva
  }
  if (input.capaCualitativaActiva !== undefined) {
    data.capaCualitativaActiva = input.capaCualitativaActiva
  }
  if (input.capaComprensionActiva !== undefined) {
    data.capaComprensionActiva = input.capaComprensionActiva
  }
  return data
}

function construirDataUpdateEntrevistaIa(
  input: ActualizarEntrevistaIaCursoInput,
): Prisma.EntrevistaIAUpdateInput {
  const data: Prisma.EntrevistaIAUpdateInput = {}
  if (input.umbralAprobacion !== undefined) {
    data.umbralAprobacion = input.umbralAprobacion
  }
  if (input.filosofia !== undefined) {
    data.filosofia = input.filosofia
  }
  if (input.profundidad !== undefined) {
    data.profundidad = input.profundidad
  }
  if (input.duracionMinutos !== undefined) {
    data.duracionMinutos = input.duracionMinutos
  }
  if (input.tono !== undefined) {
    data.tono = input.tono
  }
  return data
}

/**
 * Parser tipado del campo JSONB `Curso.umbralesLogro`. Devuelve `null` si el
 * valor persistido no respeta el shape esperado (defensa contra escrituras
 * historicas con shape distinto). El service nunca persiste shapes invalidos.
 */
function parseUmbralesLogro(raw: Prisma.JsonValue | null): UmbralesLogroValores | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  const obj = raw as Record<string, unknown>
  const excelencia = obj.excelencia
  const solido = obj.solido
  const enDesarrollo = obj.enDesarrollo
  if (
    typeof excelencia !== "number" ||
    typeof solido !== "number" ||
    typeof enDesarrollo !== "number"
  ) {
    return null
  }
  return { excelencia, solido, enDesarrollo }
}
