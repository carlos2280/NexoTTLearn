import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  BandejaCursoPendiente,
  MeBandejaContadores,
  MeBandejaResponse,
  NotificacionResumen,
  ResultadoCierreVisible,
  SiguienteAccion,
  TonoDeadline,
} from "@nexott-learn/shared-types"
import {
  BANDEJA_TOP_NOVEDADES,
  BANDEJA_TOP_PENDIENTES,
  UMBRAL_ASIGNACION_NUEVA_HORAS,
  UMBRAL_DEADLINE_CERCANO_DIAS,
  UMBRAL_DEADLINE_CRITICO_AVANCE,
  UMBRAL_VENTANA_AVISOS_DIAS,
} from "@nexott-learn/shared-types"
import {
  EstadoAsignado,
  EstadoCurso,
  EstadoIntentoTransversal,
  EstadoVoluntario,
  Prisma,
  RolAsignacion,
} from "@prisma/client"
import { evaluarCondicionesListo } from "../asignaciones/asignaciones.helpers"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"

const MS_POR_DIA = 24 * 60 * 60 * 1000
const MS_POR_HORA = 60 * 60 * 1000

const SELECT_ASIGNACION = {
  id: true,
  rol: true,
  estadoAsignado: true,
  estadoVoluntario: true,
  fechaCierre: true,
  createdAt: true,
  curso: {
    select: {
      id: true,
      titulo: true,
      estado: true,
      fechaDeadline: true,
      transversalId: true,
      entrevistaIaId: true,
    },
  },
} as const satisfies Prisma.AsignacionCursoSelect

type AsignacionRow = Prisma.AsignacionCursoGetPayload<{ select: typeof SELECT_ASIGNACION }>

const SELECT_NOTIF = {
  id: true,
  tipoEvento: true,
  esCritico: true,
  fechaCreacion: true,
  leida: true,
  fechaLeida: true,
  archivada: true,
} as const satisfies Prisma.NotificacionSelect

/**
 * Estado interno de una asignacion ACTIVA enriquecida con porcentaje y
 * resultado del helper `evaluarCondicionesListo`. Vive solo en memoria del
 * service para decidir `siguienteAccion` y construir `pendientes`.
 */
interface AsignacionEnriquecida {
  readonly row: AsignacionRow
  readonly porcentajeAvance: number
  readonly planCompleto: boolean
  readonly transversalEstado: "NO_APLICA" | "APROBADO" | "NO_APROBADO" | "TODO_S8"
  readonly entrevistaEstado: "NO_APLICA" | "APROBADO" | "NO_APROBADO" | "TODO_S9"
}

/**
 * `MeBandejaService` (D-BANDEJA-1) — endpoint unificado de la home del
 * participante. Devuelve `siguienteAccion` priorizada en server + pendientes
 * + novedades + contadores en un solo round-trip.
 *
 * La identidad del colaborador SIEMPRE proviene de la sesion del usuario
 * (controller pasa `usuarioId`). Si el usuario no tiene colaborador asociado,
 * 404 `colaboradorNoEncontrado` (mismo patron que `/me/cursos`, D90).
 *
 * Visibilidad: solo lectura del propio colaborador. No se audita (D-CAT-3).
 */
@Injectable()
export class MeBandejaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planPersonalService: PlanPersonalService,
  ) {}

  async obtenerBandeja(usuarioId: string): Promise<MeBandejaResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuario?.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
    const colaboradorId = usuario.colaboradorId

    const ahora = new Date()
    const limiteAvisos = new Date(ahora.getTime() - UMBRAL_VENTANA_AVISOS_DIAS * MS_POR_DIA)

    const [
      asignacionesActivasRaw,
      asignacionesCerradasRecientesRaw,
      novedadesRaw,
      totalNoLeidas,
      totalVoluntariadoAbierto,
      historicoReaperturasRaw,
      intentosTransversalEnRevision,
    ] = await Promise.all([
      this.cargarAsignacionesActivas(colaboradorId),
      this.cargarAsignacionesCerradasRecientes(colaboradorId, limiteAvisos),
      this.cargarNovedades(usuarioId),
      this.contarNotificacionesNoLeidas(usuarioId),
      this.contarVoluntariadoAbierto(colaboradorId),
      this.cargarReaperturasRecientes(colaboradorId, limiteAvisos),
      this.cargarIntentosTransversalEnRevision(colaboradorId),
    ])

    const asignacionesActivas = await this.enriquecerAsignaciones(asignacionesActivasRaw)
    const siguienteAccion = this.elegirSiguienteAccion({
      asignacionesActivas,
      reaperturas: historicoReaperturasRaw,
      cierresRecientes: asignacionesCerradasRecientesRaw,
      intentosTransversalEnRevision,
      totalVoluntariadoAbierto,
      ahora,
    })

    const pendientes = this.construirPendientes(asignacionesActivas, ahora)
    const novedades = novedadesRaw.map(toNotificacionResumen)

    const contadores: MeBandejaContadores = {
      notificacionesNoLeidas: totalNoLeidas,
      cursosVoluntariadoAbiertos: totalVoluntariadoAbierto,
      cursosActivos: asignacionesActivas.length,
    }

    return { siguienteAccion, pendientes, novedades, contadores }
  }

  // ---- queries -------------------------------------------------------------

  private cargarAsignacionesActivas(colaboradorId: string): Promise<AsignacionRow[]> {
    return this.prisma.asignacionCurso.findMany({
      where: {
        colaboradorId,
        curso: { estado: EstadoCurso.ACTIVO },
        // Excluir explicitamente RETIRADO: aunque el curso este ACTIVO, el
        // colaborador ya no participa.
        // biome-ignore lint/style/useNamingConvention: `OR` es operador Prisma, no clave de dominio.
        OR: [
          { rol: RolAsignacion.VOLUNTARIO, estadoVoluntario: { not: EstadoVoluntario.RETIRADO } },
          { rol: RolAsignacion.ASIGNADO, estadoAsignado: { not: EstadoAsignado.RETIRADO } },
        ],
      },
      select: SELECT_ASIGNACION,
      orderBy: { curso: { fechaDeadline: "asc" } },
    })
  }

  private cargarAsignacionesCerradasRecientes(
    colaboradorId: string,
    desde: Date,
  ): Promise<AsignacionRow[]> {
    return this.prisma.asignacionCurso.findMany({
      where: {
        colaboradorId,
        fechaCierre: { gte: desde },
        // biome-ignore lint/style/useNamingConvention: `OR` es operador Prisma, no clave de dominio.
        OR: [
          {
            rol: RolAsignacion.ASIGNADO,
            estadoAsignado: { in: [EstadoAsignado.APTO, EstadoAsignado.NO_APTO] },
          },
          { rol: RolAsignacion.VOLUNTARIO, estadoVoluntario: EstadoVoluntario.COMPLETADO },
        ],
      },
      select: SELECT_ASIGNACION,
      orderBy: { fechaCierre: "desc" },
      take: 1,
    })
  }

  private cargarNovedades(usuarioId: string): Promise<NotificacionRow[]> {
    return this.prisma.notificacion.findMany({
      where: { usuarioId, leida: false, archivada: false },
      select: SELECT_NOTIF,
      orderBy: { fechaCreacion: "desc" },
      take: BANDEJA_TOP_NOVEDADES,
    })
  }

  private contarNotificacionesNoLeidas(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: { usuarioId, leida: false, archivada: false },
    })
  }

  private contarVoluntariadoAbierto(colaboradorId: string): Promise<number> {
    return this.prisma.curso.count({
      where: {
        estado: EstadoCurso.ACTIVO,
        toggleVoluntarios: true,
        asignaciones: { none: { colaboradorId } },
      },
    })
  }

  /**
   * Intentos transversal del colaborador con `estado=EN_EVALUACION` y no
   * anulados (B-1). Se usa para detectar `ESPERANDO_REVISION`. Solo aplica
   * para proyecto transversal porque el modelo de entrevista IA no tiene un
   * estado "en revision" — la IA evalua al instante. El shape de
   * `SiguienteAccion` permite `enRevision: 'entrevistaIa'` para futuro.
   */
  private cargarIntentosTransversalEnRevision(
    colaboradorId: string,
  ): Promise<readonly IntentoTransversalEnRevisionRow[]> {
    return this.prisma.intentoTransversal.findMany({
      where: {
        colaboradorId,
        anulado: false,
        estado: EstadoIntentoTransversal.EN_EVALUACION,
      },
      select: { id: true, transversalId: true, fecha: true },
      orderBy: { fecha: "desc" },
    })
  }

  /**
   * Reaperturas recientes: entradas del historico donde el estado anterior era
   * APTO/NO_APTO y paso a EN_PROGRESO. La regla la valida `AsignacionesService`
   * al ejecutar reabrir-caso (D-AS-11); aqui solo leemos la huella.
   */
  private cargarReaperturasRecientes(
    colaboradorId: string,
    desde: Date,
  ): Promise<readonly HistoricoReaperturaRow[]> {
    return this.prisma.historicoEstadoAsignacion.findMany({
      where: {
        fecha: { gte: desde },
        estadoAnterior: { in: ["APTO", "NO_APTO"] },
        estadoNuevo: "EN_PROGRESO",
        asignacion: { colaboradorId },
      },
      select: {
        fecha: true,
        motivo: true,
        asignacion: {
          select: {
            id: true,
            curso: { select: { id: true, titulo: true, estado: true } },
          },
        },
      },
      orderBy: { fecha: "desc" },
      take: 1,
    })
  }

  // ---- enriquecimiento -----------------------------------------------------

  private enriquecerAsignaciones(
    asignaciones: readonly AsignacionRow[],
  ): Promise<readonly AsignacionEnriquecida[]> {
    return Promise.all(
      asignaciones.map(async (row): Promise<AsignacionEnriquecida> => {
        const porcentajeAvance =
          row.rol === RolAsignacion.ASIGNADO
            ? await this.planPersonalService.obtenerPorcentajeAvance(row.id)
            : 0

        const necesitaEvaluar =
          row.curso.transversalId !== null || row.curso.entrevistaIaId !== null
        const evaluacion = necesitaEvaluar
          ? await evaluarCondicionesListo(this.prisma, row.id, {
              transversalId: row.curso.transversalId,
              entrevistaIaId: row.curso.entrevistaIaId,
            })
          : null

        return {
          row,
          porcentajeAvance,
          planCompleto:
            evaluacion?.planCompleto ??
            (row.rol === RolAsignacion.ASIGNADO ? porcentajeAvance >= 100 : true),
          transversalEstado: evaluacion?.transversal ?? "NO_APLICA",
          entrevistaEstado: evaluacion?.entrevistaIA ?? "NO_APLICA",
        }
      }),
    )
  }

  // ---- decision -----------------------------------------------------------

  private elegirSiguienteAccion(input: {
    readonly asignacionesActivas: readonly AsignacionEnriquecida[]
    readonly reaperturas: readonly HistoricoReaperturaRow[]
    readonly cierresRecientes: readonly AsignacionRow[]
    readonly intentosTransversalEnRevision: readonly IntentoTransversalEnRevisionRow[]
    readonly totalVoluntariadoAbierto: number
    readonly ahora: Date
  }): SiguienteAccion | null {
    const {
      asignacionesActivas,
      reaperturas,
      cierresRecientes,
      intentosTransversalEnRevision,
      totalVoluntariadoAbierto,
      ahora,
    } = input

    // 1. CASO_REABIERTO — solo aplica si la asignacion sigue activa (no fue
    // retirada despues). Si el curso ya no esta ACTIVO, lo ignoramos.
    const reaperturaActiva = reaperturas.find(
      (r) => r.asignacion.curso.estado === EstadoCurso.ACTIVO,
    )
    if (reaperturaActiva) {
      return {
        tipo: "CASO_REABIERTO",
        asignacionId: reaperturaActiva.asignacion.id,
        cursoId: reaperturaActiva.asignacion.curso.id,
        cursoTitulo: reaperturaActiva.asignacion.curso.titulo,
        fechaReapertura: reaperturaActiva.fecha.toISOString(),
        motivo: reaperturaActiva.motivo ?? null,
      }
    }

    // 2. RESULTADO_CIERRE_LISTO — primer cierre reciente (ya ordenado desc).
    const ultimoCierre = cierresRecientes[0]
    if (ultimoCierre?.fechaCierre) {
      const resultado = mapResultadoCierre(ultimoCierre)
      if (resultado !== null) {
        return {
          tipo: "RESULTADO_CIERRE_LISTO",
          asignacionId: ultimoCierre.id,
          cursoId: ultimoCierre.curso.id,
          cursoTitulo: ultimoCierre.curso.titulo,
          resultado,
          fechaCierre: ultimoCierre.fechaCierre.toISOString(),
        }
      }
    }

    // 3. ESPERANDO_REVISION — hay un intento transversal EN_EVALUACION del
    // colaborador cuya asignacion esta activa. Gana sobre los `..._DISPONIBLE`
    // porque si esta en revision, no hay accion del usuario para ese hito.
    const esperandoRevision = construirEsperandoRevision(
      asignacionesActivas,
      intentosTransversalEnRevision,
    )
    if (esperandoRevision) {
      return esperandoRevision
    }

    // 4. ENTREVISTA_IA_DISPONIBLE — plan completo + transversal OK (o NO_APLICA)
    // + entrevista NO_APROBADA y curso tiene entrevistaIa.
    const entrevistaListaParaIr = asignacionesActivas.find(
      (a) =>
        a.row.curso.entrevistaIaId !== null &&
        a.planCompleto &&
        (a.transversalEstado === "APROBADO" || a.transversalEstado === "NO_APLICA") &&
        a.entrevistaEstado === "NO_APROBADO",
    )
    if (entrevistaListaParaIr) {
      return {
        tipo: "ENTREVISTA_IA_DISPONIBLE",
        asignacionId: entrevistaListaParaIr.row.id,
        cursoId: entrevistaListaParaIr.row.curso.id,
        cursoTitulo: entrevistaListaParaIr.row.curso.titulo,
      }
    }

    // 5. TRANSVERSAL_DISPONIBLE — plan completo + transversal NO_APROBADO.
    const transversalListoParaIr = asignacionesActivas.find(
      (a) =>
        a.row.curso.transversalId !== null &&
        a.planCompleto &&
        a.transversalEstado === "NO_APROBADO",
    )
    if (transversalListoParaIr) {
      return {
        tipo: "TRANSVERSAL_DISPONIBLE",
        asignacionId: transversalListoParaIr.row.id,
        cursoId: transversalListoParaIr.row.curso.id,
        cursoTitulo: transversalListoParaIr.row.curso.titulo,
      }
    }

    // 6. DEADLINE_CRITICO — deadline en <=7 dias, avance < 80, no completado.
    const critico = asignacionesActivas
      .map((a) => ({ a, dias: diasRestantes(a.row.curso.fechaDeadline, ahora) }))
      .filter(({ a, dias }) => {
        if (a.row.rol !== RolAsignacion.ASIGNADO) {
          return false
        }
        if (a.porcentajeAvance >= 100) {
          return false
        }
        return (
          dias <= UMBRAL_DEADLINE_CERCANO_DIAS &&
          a.porcentajeAvance < UMBRAL_DEADLINE_CRITICO_AVANCE
        )
      })
      .sort((x, y) => x.dias - y.dias)[0]
    if (critico) {
      return {
        tipo: "DEADLINE_CRITICO",
        asignacionId: critico.a.row.id,
        cursoId: critico.a.row.curso.id,
        cursoTitulo: critico.a.row.curso.titulo,
        fechaDeadline: critico.a.row.curso.fechaDeadline.toISOString(),
        diasRestantes: critico.dias,
        porcentajeAvance: critico.a.porcentajeAvance,
      }
    }

    // 7. ASIGNACION_NUEVA — creada hace < 48h y todavia en ASIGNADO (no entro).
    const limiteNuevas = new Date(ahora.getTime() - UMBRAL_ASIGNACION_NUEVA_HORAS * MS_POR_HORA)
    const reciente = asignacionesActivas.find(
      (a) =>
        a.row.rol === RolAsignacion.ASIGNADO &&
        a.row.estadoAsignado === EstadoAsignado.ASIGNADO &&
        a.row.createdAt >= limiteNuevas,
    )
    if (reciente) {
      return {
        tipo: "ASIGNACION_NUEVA",
        asignacionId: reciente.row.id,
        cursoId: reciente.row.curso.id,
        cursoTitulo: reciente.row.curso.titulo,
        fechaAsignacion: reciente.row.createdAt.toISOString(),
      }
    }

    // 8. CONTINUAR_CURSO — primer curso ACTIVO con avance < 100 (ya ordenado
    // por deadline asc). Voluntarios al final.
    const ordenadas = [...asignacionesActivas].sort((a, b) => {
      // ASIGNADO antes que VOLUNTARIO.
      if (a.row.rol !== b.row.rol) {
        return a.row.rol === RolAsignacion.ASIGNADO ? -1 : 1
      }
      return a.row.curso.fechaDeadline.getTime() - b.row.curso.fechaDeadline.getTime()
    })
    const continuar = ordenadas.find((a) => a.porcentajeAvance < 100)
    if (continuar) {
      return {
        tipo: "CONTINUAR_CURSO",
        asignacionId: continuar.row.id,
        cursoId: continuar.row.curso.id,
        cursoTitulo: continuar.row.curso.titulo,
        porcentajeAvance: continuar.porcentajeAvance,
        siguienteSeccionTitulo: null,
      }
    }

    // 9. EXPLORAR_VOLUNTARIADO — sin cursos activos pero hay catalogo abierto.
    if (asignacionesActivas.length === 0 && totalVoluntariadoAbierto > 0) {
      return {
        tipo: "EXPLORAR_VOLUNTARIADO",
        totalCursosAbiertos: totalVoluntariadoAbierto,
      }
    }

    return null
  }

  // ---- pendientes ---------------------------------------------------------

  private construirPendientes(
    asignaciones: readonly AsignacionEnriquecida[],
    ahora: Date,
  ): readonly BandejaCursoPendiente[] {
    const conPendiente = asignaciones.filter((a) => a.porcentajeAvance < 100)
    const top = [...conPendiente]
      .sort((a, b) => {
        if (a.row.rol !== b.row.rol) {
          return a.row.rol === RolAsignacion.ASIGNADO ? -1 : 1
        }
        return a.row.curso.fechaDeadline.getTime() - b.row.curso.fechaDeadline.getTime()
      })
      .slice(0, BANDEJA_TOP_PENDIENTES)

    return top.map((a) => {
      const dias = diasRestantes(a.row.curso.fechaDeadline, ahora)
      return {
        asignacionId: a.row.id,
        cursoId: a.row.curso.id,
        cursoTitulo: a.row.curso.titulo,
        rol: a.row.rol,
        estadoAsignado: a.row.estadoAsignado as EstadoAsignado | null,
        estadoVoluntario: a.row.estadoVoluntario as EstadoVoluntario | null,
        fechaDeadline: a.row.curso.fechaDeadline.toISOString(),
        diasRestantes: dias,
        tonoDeadline: tonoPorDias(dias),
        porcentajeAvance: a.porcentajeAvance,
      }
    })
  }
}

// ===== Helpers ==============================================================

interface NotificacionRow {
  id: string
  tipoEvento: string
  esCritico: boolean
  fechaCreacion: Date
  leida: boolean
  fechaLeida: Date | null
  archivada: boolean
}

interface HistoricoReaperturaRow {
  readonly fecha: Date
  readonly motivo: string | null
  readonly asignacion: {
    readonly id: string
    readonly curso: { readonly id: string; readonly titulo: string; readonly estado: EstadoCurso }
  }
}

interface IntentoTransversalEnRevisionRow {
  readonly id: string
  readonly transversalId: string
  readonly fecha: Date
}

function toNotificacionResumen(row: NotificacionRow): NotificacionResumen {
  return {
    id: row.id,
    tipoEvento: row.tipoEvento as NotificacionResumen["tipoEvento"],
    esCritico: row.esCritico,
    fechaCreacion: row.fechaCreacion.toISOString(),
    leida: row.leida,
    fechaLeida: row.fechaLeida?.toISOString() ?? null,
    archivada: row.archivada,
  }
}

function diasRestantes(deadline: Date, ahora: Date): number {
  const diff = deadline.getTime() - ahora.getTime()
  return Math.ceil(diff / MS_POR_DIA)
}

function tonoPorDias(dias: number): TonoDeadline {
  if (dias < 0) {
    return "vencido"
  }
  if (dias <= UMBRAL_DEADLINE_CERCANO_DIAS) {
    return "cercano"
  }
  return "lejos"
}

function construirEsperandoRevision(
  asignaciones: readonly AsignacionEnriquecida[],
  intentos: readonly IntentoTransversalEnRevisionRow[],
): SiguienteAccion | null {
  if (intentos.length === 0) {
    return null
  }
  const transversalIds = new Set(intentos.map((i) => i.transversalId))
  const asignacion = asignaciones.find(
    (a) => a.row.curso.transversalId !== null && transversalIds.has(a.row.curso.transversalId),
  )
  if (!asignacion) {
    return null
  }
  const intento = intentos.find((i) => i.transversalId === asignacion.row.curso.transversalId)
  if (!intento) {
    return null
  }
  return {
    tipo: "ESPERANDO_REVISION",
    asignacionId: asignacion.row.id,
    cursoId: asignacion.row.curso.id,
    cursoTitulo: asignacion.row.curso.titulo,
    enRevision: "transversal",
    fechaEnvio: intento.fecha.toISOString(),
  }
}

function mapResultadoCierre(row: AsignacionRow): ResultadoCierreVisible | null {
  if (row.rol === RolAsignacion.ASIGNADO) {
    if (row.estadoAsignado === EstadoAsignado.APTO) {
      return "APTO"
    }
    if (row.estadoAsignado === EstadoAsignado.NO_APTO) {
      return "NO_APTO"
    }
    return null
  }
  if (row.estadoVoluntario === EstadoVoluntario.COMPLETADO) {
    return "COMPLETADO"
  }
  return null
}
