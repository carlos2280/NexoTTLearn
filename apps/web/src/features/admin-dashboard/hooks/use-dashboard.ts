import type { AdminDashboardResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerDashboard } from "../api/obtener-dashboard.api"

export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"] as const

export function useAdminDashboard() {
  return useQuery<AdminDashboardResponse>({
    queryKey: ADMIN_DASHBOARD_KEY,
    queryFn: obtenerDashboard,
    staleTime: 30_000,
  })
}
