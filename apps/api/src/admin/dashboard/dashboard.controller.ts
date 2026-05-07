// P1 · controller admin del dashboard. Read-only, RolGuard ADMIN.

import { Controller, Get, UseGuards } from "@nestjs/common"
import type { AdminDashboardResponse } from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { DashboardService } from "./dashboard.service"

@Controller("admin/dashboard")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  obtenerDashboard(): Promise<AdminDashboardResponse> {
    return this.dashboard.obtenerDashboard()
  }
}
