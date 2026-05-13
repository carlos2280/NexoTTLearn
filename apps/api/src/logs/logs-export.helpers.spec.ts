import { describe, expect, it } from "vitest"
import {
  COLUMNAS_LOGS_AJUSTES_PLAN,
  COLUMNAS_LOGS_ASIGNACIONES,
  COLUMNAS_LOGS_CONSULTAS,
  COLUMNAS_LOGS_CURSOS,
  COLUMNAS_LOGS_MODULOS,
  COLUMNAS_LOGS_SKILLS,
  aplanarFilaConsulta,
  aplanarFilaCurso,
  nombreArchivoExport,
} from "./logs-export.helpers"

/**
 * Cobertura unitaria del helper local del visor `/admin/logs/*` (P-B-c).
 * Verifica orden y headers de las 6 definiciones de columnas, formato
 * estable del filename y aplanado JSONB → string para CSV/XLSX.
 */

describe("nombreArchivoExport", () => {
  it("formato estable `logs-<dominio>-YYYYMMDD.<extension>`", () => {
    expect(nombreArchivoExport("cursos", "csv", new Date("2026-05-13T12:00:00Z"))).toBe(
      "logs-cursos-20260513.csv",
    )
    expect(nombreArchivoExport("ajustes-plan", "xlsx", new Date("2026-01-09T00:00:00Z"))).toBe(
      "logs-ajustes-plan-20260109.xlsx",
    )
  })
})

describe("columnas por dominio", () => {
  it("cursos: 10 columnas en orden documentado", () => {
    const headers = COLUMNAS_LOGS_CURSOS.map((c) => c.header)
    expect(headers).toEqual([
      "id",
      "cursoId",
      "cursoTitulo",
      "fecha",
      "autorUsuarioId",
      "autorEmail",
      "autorNombre",
      "accion",
      "motivo",
      "previewImpacto",
    ])
    expect(COLUMNAS_LOGS_CURSOS.find((c) => c.key === "fecha")?.formato).toBe("fecha")
  })

  it("asignaciones: 10 columnas con logCambioCursoId", () => {
    const keys = COLUMNAS_LOGS_ASIGNACIONES.map((c) => c.key)
    expect(keys).toContain("logCambioCursoId")
    expect(keys).toContain("estadoAnterior")
    expect(keys).toContain("estadoNuevo")
    expect(keys).toHaveLength(10)
  })

  it("skills: 12 columnas (union renombrados + cambios area)", () => {
    const keys = COLUMNAS_LOGS_SKILLS.map((c) => c.key)
    expect(keys).toContain("tipoEvento")
    expect(keys).toContain("etiquetaAnterior")
    expect(keys).toContain("areaNuevaId")
    expect(keys).toHaveLength(12)
  })

  it("modulos: 9 columnas con estadoAnterior/Nuevo", () => {
    const keys = COLUMNAS_LOGS_MODULOS.map((c) => c.key)
    expect(keys).toEqual([
      "id",
      "moduloId",
      "fecha",
      "autorUsuarioId",
      "autorEmail",
      "autorNombre",
      "estadoAnterior",
      "estadoNuevo",
      "motivo",
    ])
  })

  it("ajustes-plan: 9 columnas con accion/seccionId", () => {
    const keys = COLUMNAS_LOGS_AJUSTES_PLAN.map((c) => c.key)
    expect(keys).toContain("accion")
    expect(keys).toContain("seccionId")
    expect(keys).toHaveLength(9)
  })

  it("consultas: 8 columnas con queryParams + latenciaMs numero", () => {
    const keys = COLUMNAS_LOGS_CONSULTAS.map((c) => c.key)
    expect(keys).toEqual([
      "id",
      "fecha",
      "autorUsuarioId",
      "autorEmail",
      "autorNombre",
      "endpoint",
      "queryParams",
      "latenciaMs",
    ])
    expect(COLUMNAS_LOGS_CONSULTAS.find((c) => c.key === "latenciaMs")?.formato).toBe("numero")
  })
})

describe("aplanarFilaCurso", () => {
  it("serializa previewImpacto objeto a JSON string", () => {
    const filaAplanada = aplanarFilaCurso({
      id: "id-1",
      cursoId: "curso-1",
      cursoTitulo: "Backend",
      fecha: "2026-05-10T09:00:00.000Z",
      autorUsuarioId: "u-1",
      autorEmail: "a@b.test",
      autorNombre: "Admin",
      accion: "PUBLICACION",
      motivo: "Init",
      previewImpacto: { afectados: 3, modulos: ["m1"] },
    })
    expect(filaAplanada.previewImpacto).toBe('{"afectados":3,"modulos":["m1"]}')
  })

  it("previewImpacto null queda como string vacio", () => {
    const filaAplanada = aplanarFilaCurso({
      id: "id-1",
      cursoId: "curso-1",
      cursoTitulo: null,
      fecha: "2026-05-10T09:00:00.000Z",
      autorUsuarioId: "u-1",
      autorEmail: null,
      autorNombre: null,
      accion: "PUBLICACION",
      motivo: "",
      previewImpacto: null,
    })
    expect(filaAplanada.previewImpacto).toBe("")
  })
})

describe("aplanarFilaConsulta", () => {
  it("serializa queryParams a JSON string para celda CSV", () => {
    const filaAplanada = aplanarFilaConsulta({
      id: "id-1",
      fecha: "2026-05-13T10:00:00.000Z",
      autorUsuarioId: "u-1",
      autorEmail: null,
      autorNombre: null,
      endpoint: "/admin/logs/cursos",
      queryParams: { page: 1, pageSize: 50 },
      latenciaMs: 42,
    })
    expect(filaAplanada.queryParams).toBe('{"page":1,"pageSize":50}')
  })
})
