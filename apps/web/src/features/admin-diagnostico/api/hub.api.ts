import { httpClient } from "@/shared/api/http-client"
import {
  type HubDiagnosticoResponse,
  hubDiagnosticoResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerHubDiagnostico(): Promise<HubDiagnosticoResponse> {
  const data = await httpClient.get<HubDiagnosticoResponse>("/admin/diagnostico/hub")
  return hubDiagnosticoResponseSchema.parse(data)
}
