import { z } from "zod"
import { rolUsuarioSchema } from "../auth/perfil.schema"

export const estadoEmpleadoSchema = z.enum(["ACTIVO", "EX_EMPLEADO"])
export type EstadoEmpleado = z.infer<typeof estadoEmpleadoSchema>

export const listarColaboradoresQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(120).optional(),
  rol: rolUsuarioSchema.optional(),
  estadoEmpleado: estadoEmpleadoSchema.optional(),
  bloqueado: z.coerce.boolean().optional(),
})

export type ListarColaboradoresQuery = z.infer<typeof listarColaboradoresQuerySchema>

export interface ColaboradorAdminUsuarioInfo {
  readonly id: string
  readonly rol: "ADMIN" | "PARTICIPANTE"
  readonly bloqueado: boolean
  readonly mfaHabilitado: boolean
  readonly requiereCambioPassword: boolean
  readonly requiereSetupMfa: boolean
  readonly intentosFallidos: number
  readonly ultimoLogin: string | null
}

export interface ColaboradorAdminResumen {
  readonly id: string
  readonly email: string
  readonly nombre: string
  readonly estadoEmpleado: EstadoEmpleado
  readonly fechaOffBoarding: string | null
  readonly createdAt: string
  readonly usuario: ColaboradorAdminUsuarioInfo | null
}
