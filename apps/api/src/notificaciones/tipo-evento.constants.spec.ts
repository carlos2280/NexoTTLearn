import { TipoEventoNotif } from "@prisma/client"
import { describe, expect, it } from "vitest"
import {
  AUDIENCIA_POR_TIPO,
  TIPOS_CRITICOS,
  catalogoTipoEvento,
  esTipoCritico,
} from "./tipo-evento.constants"

describe("tipo-evento.constants", () => {
  it("TIPOS_CRITICOS contiene exactamente los 5 tipos no silenciables (§19.2 / D-S10-A2)", () => {
    const esperados: ReadonlySet<TipoEventoNotif> = new Set<TipoEventoNotif>([
      TipoEventoNotif.ASIGNACION_CURSO,
      TipoEventoNotif.CASO_REABIERTO,
      TipoEventoNotif.RESULTADO_CIERRE,
      TipoEventoNotif.EXCEL_CARGADO,
      TipoEventoNotif.MODULO_HUERFANO_SKILL,
    ])
    expect(TIPOS_CRITICOS.size).toBe(esperados.size)
    for (const tipo of esperados) {
      expect(TIPOS_CRITICOS.has(tipo)).toBe(true)
    }
  })

  it("esTipoCritico devuelve true solo para tipos criticos", () => {
    expect(esTipoCritico(TipoEventoNotif.ASIGNACION_CURSO)).toBe(true)
    expect(esTipoCritico(TipoEventoNotif.RESULTADO_CIERRE)).toBe(true)
    expect(esTipoCritico(TipoEventoNotif.PLAN_RECALCULADO)).toBe(false)
    expect(esTipoCritico(TipoEventoNotif.TRANSVERSAL_DISPONIBLE)).toBe(false)
  })

  it("AUDIENCIA_POR_TIPO mapea cada uno de los 13 tipos D88", () => {
    const valoresEnum = Object.values(TipoEventoNotif)
    for (const tipo of valoresEnum) {
      const audiencia = AUDIENCIA_POR_TIPO.get(tipo)
      expect(audiencia).toMatch(/^(participante|admin)$/)
    }
    expect(AUDIENCIA_POR_TIPO.get(TipoEventoNotif.PLAN_RECALCULADO)).toBe("participante")
    expect(AUDIENCIA_POR_TIPO.get(TipoEventoNotif.EXCEL_CARGADO)).toBe("admin")
  })

  it("catalogoTipoEvento.tienePlantilla devuelve false para los 13 tipos en P10a", () => {
    const valoresEnum = Object.values(TipoEventoNotif)
    for (const tipo of valoresEnum) {
      expect(catalogoTipoEvento.tienePlantilla(tipo)).toBe(false)
    }
  })
})
