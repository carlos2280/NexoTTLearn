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
  ActualizarCursoInput,
  CrearCursoInput,
  CursoDetalle,
  CursoResumen,
  DuplicarCursoInput,
  DuplicarCursoResponse,
  ListarCursosQuery,
  ListarLogCambiosQuery,
  LogCambioCurso as LogCambioCursoDto,
  Paginated,
} from "@nexott-learn/shared-types"
import { AccionLogCurso, EstadoCurso, EstadoModulo, Prisma, RolUsuario } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"

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
      const actualizado = await tx.curso.update({
        where: { id: cursoId },
        data,
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
      const actualizado = await tx.curso.update({
        where: { id: cursoId },
        data: { estado: EstadoCurso.ARCHIVADO },
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
      const actualizado = await tx.curso.update({
        where: { id: cursoId },
        data: { estado: EstadoCurso.CERRADO },
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
}
