import { httpClient } from "@/shared/api/http-client"
import {
  type AdminDashboardResponse,
  adminDashboardResponseSchema,
} from "@nexott-learn/shared-types"

// Validamos el response con Zod en el cliente: blinda el adapter contra
// cambios de contrato accidentales (campos faltantes, enums fuera de rango).
export async function obtenerAdminDashboard(): Promise<AdminDashboardResponse> {
  const data = await httpClient.get<AdminDashboardResponse>("/admin/dashboard")
  return adminDashboardResponseSchema.parse(data)
}
