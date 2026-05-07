import { httpClient } from "@/shared/api/http-client"
import {
  type AdminDashboardResponse,
  adminDashboardResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerDashboard(): Promise<AdminDashboardResponse> {
  const data = await httpClient.get<AdminDashboardResponse>("/admin/dashboard")
  return adminDashboardResponseSchema.parse(data)
}
