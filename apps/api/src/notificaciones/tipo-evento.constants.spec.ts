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

  it("catalogoTipoEvento.tienePlantilla devuelve true solo para los tipos con plantilla activa (P10c + P11a + P11.5a + P11.5b + P11.5c)", () => {
    // P11a anade `CURSO_DEADLINE` al registro PLANTILLAS (D-S11-A9, D-S11-C10).
    // P11.5a anade ASIGNACION_CURSO, CASO_REABIERTO, TRANSVERSAL_DISPONIBLE,
    // ENTREVISTA_IA_DISPONIBLE (D-S11.5-A1..A4). P11.5b anade COLABORADOR_LISTO,
    // EXCEL_CARGADO, PLANES_DESACTUALIZADOS, MODULO_HUERFANO_SKILL
    // (D-S11.5-B1..B4). P11.5c cierra el catalogo D88 con RECORDATORIO_DEADLINE
    // y CENTRO_REVISION (D-S11.5-C1/C3) — todos los 13 tipos enum tienen plantilla.
    const conPlantilla: ReadonlySet<TipoEventoNotif> = new Set<TipoEventoNotif>([
      TipoEventoNotif.PLAN_RECALCULADO,
      TipoEventoNotif.RESULTADO_CIERRE,
      TipoEventoNotif.CURSO_DEADLINE,
      TipoEventoNotif.ASIGNACION_CURSO,
      TipoEventoNotif.CASO_REABIERTO,
      TipoEventoNotif.TRANSVERSAL_DISPONIBLE,
      TipoEventoNotif.ENTREVISTA_IA_DISPONIBLE,
      TipoEventoNotif.COLABORADOR_LISTO,
      TipoEventoNotif.EXCEL_CARGADO,
      TipoEventoNotif.PLANES_DESACTUALIZADOS,
      TipoEventoNotif.MODULO_HUERFANO_SKILL,
      TipoEventoNotif.RECORDATORIO_DEADLINE,
      TipoEventoNotif.CENTRO_REVISION,
    ])
    const valoresEnum = Object.values(TipoEventoNotif)
    for (const tipo of valoresEnum) {
      expect(catalogoTipoEvento.tienePlantilla(tipo)).toBe(conPlantilla.has(tipo))
    }
  })
})
