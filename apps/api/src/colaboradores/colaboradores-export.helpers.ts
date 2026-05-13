import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"
import type { ColumnaDef } from "../common/export/export.types"

export interface FilaColaboradorExport {
  readonly id: string
  readonly nombre: string
  readonly email: string
  readonly rol: string
  readonly estadoEmpleado: string
  readonly bloqueado: string
  readonly mfaHabilitado: string
  readonly requiereCambioPassword: string
  readonly intentosFallidos: number
  readonly ultimoLogin: string
  readonly fechaOffBoarding: string
  readonly altaSistema: string
}

export const COLUMNAS_COLABORADORES_EXPORT: readonly ColumnaDef<FilaColaboradorExport>[] = [
  { key: "id", header: "ID", formato: "texto" },
  { key: "nombre", header: "Nombre", formato: "texto" },
  { key: "email", header: "Email", formato: "texto" },
  { key: "rol", header: "Rol", formato: "texto" },
  { key: "estadoEmpleado", header: "Estado empleado", formato: "texto" },
  { key: "bloqueado", header: "Bloqueado", formato: "texto" },
  { key: "mfaHabilitado", header: "MFA habilitado", formato: "texto" },
  // biome-ignore lint/nursery/noSecrets: nombre de columna del export, no es un secreto.
  { key: "requiereCambioPassword", header: "Debe cambiar contraseña", formato: "texto" },
  { key: "intentosFallidos", header: "Intentos fallidos", formato: "numero" },
  { key: "ultimoLogin", header: "Último acceso", formato: "fecha" },
  { key: "fechaOffBoarding", header: "Fecha off-boarding", formato: "fecha" },
  { key: "altaSistema", header: "Alta en el sistema", formato: "fecha" },
]

function siNo(valor: boolean | undefined | null): string {
  if (valor === undefined || valor === null) {
    return ""
  }
  return valor ? "Sí" : "No"
}

export function aplanarColaboradorParaExport(c: ColaboradorAdminResumen): FilaColaboradorExport {
  return {
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    rol: c.usuario?.rol ?? "",
    estadoEmpleado: c.estadoEmpleado,
    bloqueado: siNo(c.usuario?.bloqueado ?? null),
    mfaHabilitado: siNo(c.usuario?.mfaHabilitado ?? null),
    requiereCambioPassword: siNo(c.usuario?.requiereCambioPassword ?? null),
    intentosFallidos: c.usuario?.intentosFallidos ?? 0,
    ultimoLogin: c.usuario?.ultimoLogin ?? "",
    fechaOffBoarding: c.fechaOffBoarding ?? "",
    altaSistema: c.createdAt,
  }
}

export function nombreArchivoExportColaboradores(extension: "csv" | "xlsx"): string {
  const fecha = new Date().toISOString().slice(0, 10)
  return `colaboradores-${fecha}.${extension}`
}
