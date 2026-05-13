import { Logger } from "@nestjs/common"
import { Prisma, RolUsuario, TipoEventoNotif } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"
import { NotificacionesService } from "./notificaciones.service"

const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * `broadcastAdminsActivos` — helper P11.5b (D-S11.5-B5).
 *
 * Resuelve la audiencia "admins activos" y emite UNA notificacion in-app por
 * cada admin via `NotificacionesService.crear()`. Reutilizado por los triggers
 * admin de P11.5b (COLABORADOR_LISTO, PLANES_DESACTUALIZADOS,
 * MODULO_HUERFANO_SKILL) y por los crons de P11.5c (CENTRO_REVISION).
 *
 * El filtro respeta D84 (no enviar a EX_EMPLEADO) y excluye usuarios
 * `bloqueado=true`. El silenciado por preferencia y el guard EX_EMPLEADO se
 * aplican adicionalmente dentro de `NotificacionesService.crear()` (P10a).
 *
 * Patron fire-and-forget heredado P10c / P11.5a: cada admin se intenta de
 * forma independiente; un fallo individual se logguea con `Logger.warn` y NO
 * propaga al caller. Si la query inicial de admins falla, el error si se
 * propaga (es un fallo de infraestructura, no del envio).
 *
 * Vive fuera de `NotificacionesService` para minimizar acoplamiento: el
 * service `crear()` permanece intacto y los triggers admin importan este
 * helper directamente (DE-P11.5b-2).
 */
export async function broadcastAdminsActivos(
  prisma: PrismaService,
  notificaciones: NotificacionesService,
  logger: Logger,
  tipo: TipoEventoNotif,
  payload: Prisma.InputJsonObject,
): Promise<void> {
  const admins = await prisma.usuario.findMany({
    where: {
      rol: RolUsuario.ADMIN,
      bloqueado: false,
      colaborador: { estadoEmpleado: { not: "EX_EMPLEADO" } },
    },
    select: { id: true },
  })

  if (admins.length === 0) {
    logger.warn(`broadcast | tipo=${tipo} | motivo=no-admins-activos`)
    return
  }

  for (const admin of admins) {
    try {
      await notificaciones.crear({ usuarioId: admin.id, tipo, payload })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      logger.warn(`broadcast | fallo | tipo=${tipo} | admin=${admin.id} | error=${detalle}`)
    }
  }
}

/**
 * `yaEmitidoHoy` — helper de idempotencia diaria para crons (D-S11.5-C5).
 *
 * Resuelve si ya existe en la tabla `notificaciones` al menos una fila con
 * (tipo, [usuarioId?]) creada dentro de la ventana `[startOfDay(hoy),
 * startOfDay(hoy+1))`. Se usa antes de emitir para evitar duplicar el envio
 * si el container reinicia entre 08:00 y 08:01 y `@Cron` se dispara dos veces.
 *
 * Discriminante:
 *  - Si `usuarioId` se proporciona: idempotencia por (usuarioId, tipo, dia).
 *    Caso `RECORDATORIO_DEADLINE` — un colaborador no recibe 2 al dia.
 *  - Si `usuarioId` es `null`: idempotencia por (tipo, dia) — cualquier fila
 *    del tipo basta para considerar emitido el digest del dia. Caso
 *    `CENTRO_REVISION` — basta una de las N filas del broadcast para detectar
 *    que ya se emitio hoy.
 *
 * Mantenido SIN migracion (D-S11.5-C5): se reutiliza el indice
 * `idx_notif_usuario_fecha` para queries con `usuarioId` y se acepta un scan
 * acotado de un dia para queries sin `usuarioId` (volumen MVP < 1k filas/dia).
 */
export async function yaEmitidoHoy(
  prisma: PrismaService,
  tipo: TipoEventoNotif,
  usuarioId: string | null,
  hoy: Date,
): Promise<boolean> {
  const inicioDia = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
  const inicioManana = new Date(inicioDia.getTime() + MS_POR_DIA)
  const where: Prisma.NotificacionWhereInput = {
    tipoEvento: tipo,
    fechaCreacion: { gte: inicioDia, lt: inicioManana },
    ...(usuarioId === null ? {} : { usuarioId }),
  }
  const existente = await prisma.notificacion.findFirst({
    where,
    select: { id: true },
  })
  return existente !== null
}
