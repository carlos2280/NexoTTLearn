import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarUsuarioInput,
  BloquearUsuarioInput,
  CrearUsuarioInput,
  DesbloquearUsuarioInput,
  ListarUsuariosQuery,
  ResetMfaUsuarioInput,
  ResetPasswordUsuarioInput,
  UsuarioAdmin,
  UsuarioConCredenciales,
  UsuarioListResponse,
} from "@nexott-learn/shared-types"
import { Prisma, type Rol } from "@prisma/client"
import bcrypt from "bcrypt"
import { PrismaService } from "../../common/prisma/prisma.service"
import { generarPasswordTemporal } from "./password-temporal"
import { USUARIO_SELECT, type UsuarioRow, mapUsuarioToDto } from "./usuarios.mapper"

const ENTIDAD_TIPO = "Usuario"

// Mismo factor que auth.service para mantener consistencia de costo. No lo
// reusamos por import para evitar acoplar módulos: 12 es el contrato.
const BCRYPT_ROUNDS = 12

// MAESTRO §11: Mantenedores MVP solo gestiona ADMIN/PARTICIPANTE. Filtramos
// VIEWER/SUPER_ADMIN del listado para que la UI no los vea sin querer.
const ROLES_MANTENEDOR = ["ADMIN", "PARTICIPANTE"] as const satisfies readonly Rol[]

// MAESTRO §2.1, §14.2 · CRUD admin de usuarios. P2 del MAPA-FRONT-BACK.
//
// Reglas no triviales:
// - T01·§17.1: usuarios NUNCA se eliminan; se bloquean (soft delete).
// - §8.1: alta y reset generan password temporal con debeCambiarPassword=true.
//   La password temporal se devuelve UNA SOLA VEZ en la respuesta. El admin
//   la copia y se la pasa al usuario por canal externo (sin email automático
//   en MVP, §14.4).
// - §8.1.1: MFA opcional. "Activar" pone mfaActivado=true pero deja
//   mfaSecret=null y mfaConfirmadoEn=null → próxima vez que el usuario
//   entre, debe configurar app TOTP. "Reset MFA" desactiva y limpia secret.
// - Mantenedores no muta passwordHash directo: pasa por reset que regenera
//   temporal. Cambio de email tampoco (no entra al MVP).
// - Cada mutación va con LogActividad (T02·I3) en la misma transacción.

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarUsuariosQuery): Promise<UsuarioListResponse> {
    const { rol, estado, mfa, q, page, pageSize } = query

    const where: Prisma.UsuarioWhereInput = {
      rol: rol ? { equals: rol } : { in: [...ROLES_MANTENEDOR] },
    }
    if (estado) {
      where.bloqueado = estado === "BLOQUEADO"
    }
    if (typeof mfa === "boolean") {
      where.mfaActivado = mfa
    }
    if (q) {
      // Fuzzy sobre nombre/apellido/email. Sin índice trigram en MVP; el
      // catálogo típico es < 200 filas.
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { apellido: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ]
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: USUARIO_SELECT,
      }),
      this.prisma.usuario.count({ where }),
    ])

    return {
      items: items.map(mapUsuarioToDto),
      total,
      page,
      pageSize,
    }
  }

  async obtenerPorId(id: string): Promise<UsuarioAdmin> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: USUARIO_SELECT,
    })
    if (!(usuario && esRolMantenedor(usuario.rol))) {
      throw new NotFoundException("Usuario no encontrado")
    }
    return mapUsuarioToDto(usuario)
  }

  async crear(input: CrearUsuarioInput, actorId: string): Promise<UsuarioConCredenciales> {
    const email = input.email.trim().toLowerCase()
    const duplicado = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    })
    if (duplicado) {
      throw new ConflictException(`Ya existe un usuario con el email "${email}"`)
    }

    const passwordTemporal = generarPasswordTemporal()
    const passwordHash = await bcrypt.hash(passwordTemporal, BCRYPT_ROUNDS)

    const creado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
          nombre: input.nombre.trim(),
          apellido: input.apellido.trim(),
          rol: input.rol,
          passwordHash,
          // §8.1: temporal obliga cambio en el primer login.
          debeCambiarPassword: true,
          // §8.1.1: si admin pidió MFA, lo marca activo pero el setup real
          // (escaneo QR) ocurre en el primer login.
          mfaActivado: input.activarMfa,
        },
        select: USUARIO_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "USUARIO_CREADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: usuario.id,
          valorAntes: Prisma.JsonNull,
          valorDespues: snapshot(usuario),
        },
      })
      return usuario
    })

    return {
      usuario: mapUsuarioToDto(creado),
      passwordTemporal,
    }
  }

  async actualizar(
    id: string,
    input: ActualizarUsuarioInput,
    actorId: string,
  ): Promise<UsuarioAdmin> {
    const previo = await this.cargarMantenedor(id)

    const data: Prisma.UsuarioUpdateInput = {}
    if (input.nombre !== undefined) {
      data.nombre = input.nombre.trim()
    }
    if (input.apellido !== undefined) {
      data.apellido = input.apellido.trim()
    }
    if (input.rol !== undefined) {
      data.rol = input.rol
    }

    if (Object.keys(data).length === 0) {
      // PATCH vacío: nada que hacer. Devolvemos el estado actual sin log.
      return mapUsuarioToDto(previo)
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data,
        select: USUARIO_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "USUARIO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(usuario),
        },
      })
      return usuario
    })

    return mapUsuarioToDto(actualizado)
  }

  async bloquear(id: string, input: BloquearUsuarioInput, actorId: string): Promise<UsuarioAdmin> {
    const previo = await this.cargarMantenedor(id)
    if (id === actorId) {
      // Una cuenta admin no puede auto-bloquearse: dejaría el sistema sin
      // forma de operar si es la única ADMIN.
      throw new BadRequestException("No puedes bloquearte a ti mismo")
    }
    if (previo.bloqueado) {
      // Idempotente: ya estaba bloqueado. No repetimos log.
      return mapUsuarioToDto(previo)
    }

    const bloqueado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: { bloqueado: true, bloqueadoAt: new Date() },
        select: USUARIO_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "USUARIO_BLOQUEADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(usuario),
          motivo: input.motivo,
        },
      })
      return usuario
    })

    return mapUsuarioToDto(bloqueado)
  }

  async desbloquear(
    id: string,
    input: DesbloquearUsuarioInput,
    actorId: string,
  ): Promise<UsuarioAdmin> {
    const previo = await this.cargarMantenedor(id)
    if (!previo.bloqueado) {
      // Idempotente.
      return mapUsuarioToDto(previo)
    }

    const desbloqueado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: { bloqueado: false, bloqueadoAt: null, intentosFallidos: 0 },
        select: USUARIO_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "USUARIO_DESBLOQUEADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(usuario),
          motivo: input.motivo,
        },
      })
      return usuario
    })

    return mapUsuarioToDto(desbloqueado)
  }

  async resetPassword(
    id: string,
    input: ResetPasswordUsuarioInput,
    actorId: string,
  ): Promise<{ usuario: UsuarioAdmin; passwordTemporal: string }> {
    const previo = await this.cargarMantenedor(id)

    const passwordTemporal = generarPasswordTemporal()
    const passwordHash = await bcrypt.hash(passwordTemporal, BCRYPT_ROUNDS)

    const reseteado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: {
          passwordHash,
          debeCambiarPassword: true,
          // No actualizamos passwordCambiadoEn: ese campo trackea el último
          // cambio HECHO POR EL USUARIO. El admin reseteando es un evento
          // distinto, queda en el log.
          intentosFallidos: 0,
        },
        select: USUARIO_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "PASSWORD_RESETEADA",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(usuario),
          motivo: input.motivo,
        },
      })
      return usuario
    })

    return {
      usuario: mapUsuarioToDto(reseteado),
      passwordTemporal,
    }
  }

  async activarMfa(id: string, actorId: string): Promise<UsuarioAdmin> {
    const previo = await this.cargarMantenedor(id)
    if (previo.mfaActivado) {
      // Idempotente: ya estaba activado. Si el usuario perdió la app, el
      // flujo correcto es resetMfa (limpia secret) y volver a activar.
      return mapUsuarioToDto(previo)
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: {
          mfaActivado: true,
          // Sin secret aún: el usuario lo configurará al próximo login.
          mfaSecret: null,
          mfaConfirmadoEn: null,
        },
        select: USUARIO_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "MFA_ACTIVADO",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(usuario),
        },
      })
      return usuario
    })

    return mapUsuarioToDto(actualizado)
  }

  async resetMfa(id: string, input: ResetMfaUsuarioInput, actorId: string): Promise<UsuarioAdmin> {
    const previo = await this.cargarMantenedor(id)

    const tipoAccion = previo.mfaActivado ? "MFA_RESETEADO" : "MFA_DESACTIVADO"

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: {
          mfaActivado: false,
          mfaSecret: null,
          mfaConfirmadoEn: null,
        },
        select: USUARIO_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion,
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(usuario),
          motivo: input.motivo,
        },
      })
      return usuario
    })

    return mapUsuarioToDto(actualizado)
  }

  // ───────────────────────────────────────────────────────────────
  // Helpers privados
  // ───────────────────────────────────────────────────────────────

  private async cargarMantenedor(id: string): Promise<UsuarioRow> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: USUARIO_SELECT,
    })
    if (!(usuario && esRolMantenedor(usuario.rol))) {
      throw new NotFoundException("Usuario no encontrado")
    }
    return usuario
  }
}

function esRolMantenedor(rol: Rol): boolean {
  return ROLES_MANTENEDOR.includes(rol as (typeof ROLES_MANTENEDOR)[number])
}

// Snapshot JSON-serializable para LogActividad. Igual que en areas.service:
// reusa la forma de USUARIO_SELECT para que valorAntes/Despues sean
// comparables. NUNCA incluye passwordHash ni mfaSecret.
function snapshot(usuario: UsuarioRow): Prisma.InputJsonValue {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
    bloqueado: usuario.bloqueado,
    bloqueadoAt: usuario.bloqueadoAt ? usuario.bloqueadoAt.toISOString() : null,
    mfaActivado: usuario.mfaActivado,
    mfaConfirmadoEn: usuario.mfaConfirmadoEn ? usuario.mfaConfirmadoEn.toISOString() : null,
    debeCambiarPassword: usuario.debeCambiarPassword,
    passwordCambiadoEn: usuario.passwordCambiadoEn
      ? usuario.passwordCambiadoEn.toISOString()
      : null,
    ultimoLoginEn: usuario.ultimoLoginEn ? usuario.ultimoLoginEn.toISOString() : null,
    createdAt: usuario.createdAt.toISOString(),
    updatedAt: usuario.updatedAt.toISOString(),
  }
}
