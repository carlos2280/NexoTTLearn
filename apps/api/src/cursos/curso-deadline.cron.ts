import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { AccionLogCurso, EstadoCurso, RolUsuario, TipoEventoNotif } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"
import { NotificacionesService } from "../notificaciones/notificaciones.service"

const CRON_EXPRESSION_DEFAULT = "0 8 * * *"

/**
 * `CursoDeadlineCron` — Slice 11 P11a (D-S11-A9, R-S11-11).
 *
 * Detecta cursos ACTIVO cuyo `fechaDeadline` cae en `current_date` y emite
 * `CURSO_DEADLINE` al creador del curso (admin). Si no se identifica un
 * creador por `log_cambios_curso accion=CREACION` (curso seedeado sin log),
 * hace broadcast a todos los admins activos (D-S11-C9 fallback).
 *
 * Best-effort: si la emision falla para un curso, se loggea sin propagar al
 * loop — el cron no se rompe por un error puntual.
 *
 * Expresion cron leida de `process.env.CURSO_DEADLINE_CRON` al cargar el
 * modulo. Hora del servidor (UTC por defecto). Validada por Zod al arranque.
 */
@Injectable()
export class CursoDeadlineCron {
  private readonly logger = new Logger(CursoDeadlineCron.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  @Cron(process.env.CURSO_DEADLINE_CRON ?? CRON_EXPRESSION_DEFAULT)
  async ejecutar(): Promise<void> {
    const inicio = Date.now()
    const hoy = new Date()
    const hoyInicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
    const manana = new Date(hoyInicio.getTime() + 24 * 60 * 60 * 1000)

    const cursos = await this.prisma.curso.findMany({
      where: {
        estado: EstadoCurso.ACTIVO,
        fechaDeadline: { gte: hoyInicio, lt: manana },
      },
      select: { id: true, titulo: true, fechaDeadline: true },
    })

    let emitidos = 0
    for (const curso of cursos) {
      try {
        const destinatariosIds = await this.resolverDestinatarios(curso.id)
        for (const usuarioId of destinatariosIds) {
          await this.notificaciones.crear({
            usuarioId,
            tipo: TipoEventoNotif.CURSO_DEADLINE,
            payload: {
              cursoId: curso.id,
              cursoTitulo: curso.titulo,
              fechaDeadline: curso.fechaDeadline.toISOString().slice(0, 10),
            },
          })
          emitidos++
        }
      } catch (error) {
        const detalle = error instanceof Error ? error.message : String(error)
        this.logger.warn(`cron | curso-deadline | fallo curso=${curso.id} | error=${detalle}`)
      }
    }

    const duracionMs = Date.now() - inicio
    this.logger.log(
      `cron | curso-deadline | cursos=${cursos.length} | emitidos=${emitidos} | duracionMs=${duracionMs}`,
    )
  }

  private async resolverDestinatarios(cursoId: string): Promise<readonly string[]> {
    const log = await this.prisma.logCambioCurso.findFirst({
      where: { cursoId, accion: AccionLogCurso.PUBLICACION },
      orderBy: { fecha: "asc" },
      select: { autorUsuarioId: true },
    })
    if (log) {
      return [log.autorUsuarioId]
    }
    this.logger.warn(
      `cron | curso-deadline | sin-log-creacion curso=${cursoId} | fallback=broadcast-admins`,
    )
    const admins = await this.prisma.usuario.findMany({
      where: { rol: RolUsuario.ADMIN, bloqueado: false },
      select: { id: true },
    })
    return admins.map((u) => u.id)
  }
}
