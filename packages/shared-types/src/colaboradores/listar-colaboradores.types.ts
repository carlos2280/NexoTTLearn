import { z } from "zod"
import { rolUsuarioSchema } from "../auth/perfil.schema"

export const estadoEmpleadoSchema = z.enum(["ACTIVO", "EX_EMPLEADO"])
export type EstadoEmpleado = z.infer<typeof estadoEmpleadoSchema>

const filtrosColaboradoresBaseSchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  rol: rolUsuarioSchema.optional(),
  estadoEmpleado: estadoEmpleadoSchema.optional(),
  bloqueado: z.coerce.boolean().optional(),
})

export const listarColaboradoresQuerySchema = filtrosColaboradoresBaseSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListarColaboradoresQuery = z.infer<typeof listarColaboradoresQuerySchema>

export const formatoExportColaboradoresSchema = z.enum(["csv", "xlsx"])
export type FormatoExportColaboradores = z.infer<typeof formatoExportColaboradoresSchema>

export const exportarColaboradoresQuerySchema = filtrosColaboradoresBaseSchema.extend({
  formato: formatoExportColaboradoresSchema.default("csv"),
})

export type ExportarColaboradoresQuery = z.infer<typeof exportarColaboradoresQuerySchema>

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
