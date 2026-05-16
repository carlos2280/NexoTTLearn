import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import {
  EstadoAsignado,
  EstadoCurso,
  EstadoVoluntario,
  RolAsignacion,
  TipoEventoNotif,
} from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { yaEmitidoHoy } from "../notificaciones.helpers"
import { NotificacionesService } from "../notificaciones.service"

const CRON_EXPRESSION_DEFAULT = "0 8 * * *"
const MS_POR_DIA = 24 * 60 * 60 * 1000
const VENTANAS: readonly (7 | 1)[] = [7, 1]

const ESTADOS_ACTIVOS_ASIGNADO: readonly EstadoAsignado[] = [
  EstadoAsignado.ASIGNADO,
  EstadoAsignado.EN_PROGRESO,
  EstadoAsignado.LISTO,
]

const ESTADOS_ACTIVOS_VOLUNTARIO: readonly EstadoVoluntario[] = [
  EstadoVoluntario.INSCRITO,
  EstadoVoluntario.EN_PROGRESO,
  EstadoVoluntario.LISTO,
]

interface CursoDeadline {
  readonly id: string
  readonly titulo: string
  readonly fechaDeadline: Date
}

interface ResumenVentana {
  readonly cursosVistos: number
  readonly emitidos: number
  readonly omitidosIdempotencia: number
}

/**
 * `RecordatorioDeadlineCron` — Slice 11.5 P11.5c (D-S11.5-C1, D-S11.5-C2).
 *
 * Cron diario (default 08:00 UTC) que detecta cursos ACTIVO cuyo
 * `fechaDeadline` cae en `today+7` o `today+1` y emite `RECORDATORIO_DEADLINE`
 * a cada colaborador con asignacion en estado activo (no terminal). Una pasada
 * recorre las dos ventanas para minimizar queries. Best-effort: cada emision
 * va en try/catch para que un fallo aislado no rompa el loop (R-S10-2).
 *
 * Idempotencia diaria por `(usuarioId, tipo, dia)` via helper `yaEmitidoHoy`
 * (D-S11.5-C5). Filtros EX_EMPLEADO + silenciado los aplica `NotificacionesService.crear`
 * (R-S11.5-2, R-S11.5-8). La expresion cron se lee de
 * `process.env.RECORDATORIO_DEADLINE_CRON` al cargar el modulo (validada Zod).
 */
@Injectable()
export class RecordatorioDeadlineCron {
  private readonly logger = new Logger(RecordatorioDeadlineCron.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  @Cron(process.env.RECORDATORIO_DEADLINE_CRON ?? CRON_EXPRESSION_DEFAULT)
  async ejecutar(): Promise<void> {
    const inicio = Date.now()
    const hoy = new Date()
    const hoyInicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))

    let cursosVistos = 0
    let emitidos = 0
    let omitidosIdempotencia = 0

    for (const dias of VENTANAS) {
      const objetivoInicio = new Date(hoyInicio.getTime() + dias * MS_POR_DIA)
      const objetivoFin = new Date(objetivoInicio.getTime() + MS_POR_DIA)
      const cursos = await this.cursosEnVentana(objetivoInicio, objetivoFin)

      const resumen = await this.procesarVentana(cursos, dias, hoy)
      cursosVistos += resumen.cursosVistos
      emitidos += resumen.emitidos
      omitidosIdempotencia += resumen.omitidosIdempotencia
    }

    const duracionMs = Date.now() - inicio
    this.logger.log(
      `cron | recordatorio-deadline | cursos=${cursosVistos} | emitidos=${emitidos} | idempotentes=${omitidosIdempotencia} | duracionMs=${duracionMs}`,
    )
  }

  private cursosEnVentana(desde: Date, hasta: Date): Promise<readonly CursoDeadline[]> {
    return this.prisma.curso.findMany({
      where: {
        estado: EstadoCurso.ACTIVO,
        fechaDeadline: { gte: desde, lt: hasta },
      },
      select: { id: true, titulo: true, fechaDeadline: true },
    })
  }

  private async procesarVentana(
    cursos: readonly CursoDeadline[],
    dias: 7 | 1,
    hoy: Date,
  ): Promise<ResumenVentana> {
    let emitidos = 0
    let omitidosIdempotencia = 0

    for (const curso of cursos) {
      try {
        const resumen = await this.procesarCurso(curso, dias, hoy)
        emitidos += resumen.emitidos
        omitidosIdempotencia += resumen.omitidosIdempotencia
      } catch (error) {
        const detalle = error instanceof Error ? error.message : String(error)
        this.logger.warn(
          `cron | recordatorio-deadline | fallo curso=${curso.id} ventana=${dias} | error=${detalle}`,
        )
      }
    }

    return { cursosVistos: cursos.length, emitidos, omitidosIdempotencia }
  }

  private async procesarCurso(
    curso: CursoDeadline,
    dias: 7 | 1,
    hoy: Date,
  ): Promise<{ readonly emitidos: number; readonly omitidosIdempotencia: number }> {
    const asignaciones = await this.prisma.asignacionCurso.findMany({
      where: {
        cursoId: curso.id,
        // biome-ignore lint/style/useNamingConvention: `OR` es operador Prisma, no clave de dominio.
        OR: [
          {
            rol: RolAsignacion.ASIGNADO,
            estadoAsignado: { in: [...ESTADOS_ACTIVOS_ASIGNADO] },
          },
          {
            rol: RolAsignacion.VOLUNTARIO,
            estadoVoluntario: { in: [...ESTADOS_ACTIVOS_VOLUNTARIO] },
          },
        ],
      },
      select: {
        id: true,
        colaborador: { select: { usuario: { select: { id: true } } } },
      },
    })

    let emitidos = 0
    let omitidosIdempotencia = 0
    for (const asignacion of asignaciones) {
      const usuarioId = asignacion.colaborador?.usuario?.id
      if (!usuarioId) {
        continue
      }
      const yaExiste = await yaEmitidoHoy(
        this.prisma,
        TipoEventoNotif.RECORDATORIO_DEADLINE,
        usuarioId,
        hoy,
      )
      if (yaExiste) {
        omitidosIdempotencia += 1
        continue
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.RECORDATORIO_DEADLINE,
        payload: {
          asignacionId: asignacion.id,
          cursoId: curso.id,
          cursoTitulo: curso.titulo,
          fechaDeadline: curso.fechaDeadline.toISOString().slice(0, 10),
          diasRestantes: dias,
        },
      })
      emitidos += 1
    }
    return { emitidos, omitidosIdempotencia }
  }
}
