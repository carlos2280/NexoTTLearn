// Tests del selector. Funcion pura: no requiere PrismaService.

import { describe, expect, it } from "vitest"
import { construirRespuesta } from "./mis-cursos.selector"
import type { InscripcionRow } from "./mis-cursos.types"

const AHORA = new Date("2026-05-08T10:00:00.000Z")

function diasAtras(d: number): Date {
  return new Date(AHORA.getTime() - d * 24 * 60 * 60 * 1000)
}

function fixture(
  overrides: Partial<InscripcionRow> & Pick<InscripcionRow, "id" | "tipo" | "estado">,
): InscripcionRow {
  return {
    inscritaAt: diasAtras(30),
    completadaAt: null,
    abandonadaAt: null,
    cerradaSinCompletarAt: null,
    curso: {
      id: "c-uuid",
      slug: "git-fundamentals",
      titulo: "Git Fundamentals",
      descripcion: "Control de versiones desde cero.",
      empresaCliente: "Empresa XYZ",
    },
    cantidadModulos: 6,
    asignaciones: [],
    estadosModulo: [],
    notaGlobal: null,
    ...overrides,
  }
}

describe("construirRespuesta · estructura general", () => {
  it("retorna kpis y resumen en cero cuando no hay inscripciones", () => {
    const r = construirRespuesta([], AHORA)
    expect(r.resumen).toEqual({ activos: 0, completados: 0, total: 0 })
    expect(r.kpis).toEqual({ enCurso: 0, completados: 0, total: 0, notaPromedio: null })
    expect(r.asignados).toEqual([])
    expect(r.libres).toEqual([])
  })

  it("separa SOLICITUD en asignados y LIBRE en libres", () => {
    const r = construirRespuesta(
      [
        fixture({ id: "a", tipo: "SOLICITUD", estado: "ACTIVA" }),
        fixture({ id: "b", tipo: "LIBRE", estado: "ACTIVA" }),
      ],
      AHORA,
    )
    expect(r.asignados).toHaveLength(1)
    expect(r.libres).toHaveLength(1)
    expect(r.asignados[0]?.tipoInscripcion).toBe("SOLICITUD")
    expect(r.libres[0]?.tipoInscripcion).toBe("LIBRE")
  })

  it("excluye CERRADO_SIN_COMPLETAR del listado pero NO de los conteos", () => {
    const r = construirRespuesta(
      [
        fixture({ id: "a", tipo: "SOLICITUD", estado: "ACTIVA" }),
        fixture({ id: "b", tipo: "SOLICITUD", estado: "CERRADO_SIN_COMPLETAR" }),
      ],
      AHORA,
    )
    expect(r.asignados).toHaveLength(1)
    expect(r.libres).toHaveLength(0)
    // Conteos miden ACTIVA / COMPLETADA — la cerrada no suma a ninguno (terminal aparte).
    expect(r.resumen.activos).toBe(1)
    expect(r.resumen.completados).toBe(0)
  })

  it("incluye ABANDONADA solo si es LIBRE", () => {
    const r = construirRespuesta(
      [
        fixture({ id: "a", tipo: "SOLICITUD", estado: "ABANDONADA" }),
        fixture({ id: "b", tipo: "LIBRE", estado: "ABANDONADA" }),
      ],
      AHORA,
    )
    expect(r.asignados).toHaveLength(0)
    expect(r.libres).toHaveLength(1)
    expect(r.libres[0]?.estado.tipo).toBe("ABANDONADO")
  })
})

describe("KPIs", () => {
  it("enCurso cuenta solo ACTIVAs con avance > 0 en algun modulo", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          asignaciones: [{ moduloId: "m1", tipo: "OBLIGATORIO", orden: 0, tituloModulo: "M1" }],
          estadosModulo: [{ moduloId: "m1", estado: "EN_PROGRESO", porcentajeAvance: 40 }],
        }),
        fixture({ id: "b", tipo: "SOLICITUD", estado: "ACTIVA" }), // sin avance
      ],
      AHORA,
    )
    expect(r.kpis.enCurso).toBe(1)
    expect(r.kpis.total).toBe(2)
  })

  it("notaPromedio es entero redondeado de las completadas", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "COMPLETADA",
          completadaAt: diasAtras(10),
          notaGlobal: 87,
        }),
        fixture({
          id: "b",
          tipo: "SOLICITUD",
          estado: "COMPLETADA",
          completadaAt: diasAtras(20),
          notaGlobal: 94,
        }),
      ],
      AHORA,
    )
    // promedio = (87+94)/2 = 90.5 → 91
    expect(r.kpis.notaPromedio).toBe(91)
    expect(r.kpis.completados).toBe(2)
  })

  it("notaPromedio es null si no hay completadas", () => {
    const r = construirRespuesta([fixture({ id: "a", tipo: "SOLICITUD", estado: "ACTIVA" })], AHORA)
    expect(r.kpis.notaPromedio).toBeNull()
  })
})

describe("estado de la card", () => {
  it("ACTIVA sin avance → NO_INICIADO", () => {
    const r = construirRespuesta([fixture({ id: "a", tipo: "SOLICITUD", estado: "ACTIVA" })], AHORA)
    expect(r.asignados[0]?.estado).toEqual({ tipo: "NO_INICIADO" })
  })

  it("ACTIVA con avance promedio → EN_PROGRESO con porcentaje", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          asignaciones: [
            { moduloId: "m1", tipo: "OBLIGATORIO", orden: 0, tituloModulo: "M1" },
            { moduloId: "m2", tipo: "OBLIGATORIO", orden: 1, tituloModulo: "M2" },
          ],
          estadosModulo: [
            { moduloId: "m1", estado: "COMPLETADO", porcentajeAvance: 100 },
            { moduloId: "m2", estado: "EN_PROGRESO", porcentajeAvance: 30 },
          ],
        }),
      ],
      AHORA,
    )
    const estado = r.asignados[0]?.estado
    expect(estado?.tipo).toBe("EN_PROGRESO")
    if (estado?.tipo === "EN_PROGRESO") {
      expect(estado.porcentajeAvance).toBe(65)
    }
  })

  it("100% de avance pero sin sellar queda como EN_PROGRESO 99", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          asignaciones: [{ moduloId: "m1", tipo: "OBLIGATORIO", orden: 0, tituloModulo: "M1" }],
          estadosModulo: [{ moduloId: "m1", estado: "COMPLETADO", porcentajeAvance: 100 }],
        }),
      ],
      AHORA,
    )
    const estado = r.asignados[0]?.estado
    expect(estado).toEqual({ tipo: "EN_PROGRESO", porcentajeAvance: 99 })
  })

  it("COMPLETADA con nota >= 90 marca excelencia y gradiente spectral", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "COMPLETADA",
          completadaAt: diasAtras(2),
          notaGlobal: 94,
        }),
      ],
      AHORA,
    )
    const card = r.asignados[0]
    expect(card?.gradiente).toBe("spectral")
    if (card?.estado.tipo === "COMPLETADO") {
      expect(card.estado.excelencia).toBe(true)
      expect(card.estado.nota).toBe(94)
    }
  })

  it("COMPLETADA con nota < 90 NO es excelencia y mantiene gradiente derivado", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "COMPLETADA",
          completadaAt: diasAtras(20),
          notaGlobal: 78,
        }),
      ],
      AHORA,
    )
    const card = r.asignados[0]
    expect(card?.gradiente).not.toBe("spectral")
    if (card?.estado.tipo === "COMPLETADO") {
      expect(card.estado.excelencia).toBe(false)
    }
  })
})

describe("hint", () => {
  it("NO_INICIADO con OBLIGATORIO → COMENZAR_POR el primero por orden", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          asignaciones: [
            { moduloId: "m2", tipo: "OBLIGATORIO", orden: 1, tituloModulo: "Branching" },
            { moduloId: "m1", tipo: "OBLIGATORIO", orden: 0, tituloModulo: "Intro Git" },
            { moduloId: "m3", tipo: "OPCIONAL", orden: 2, tituloModulo: "Workflows" },
          ],
        }),
      ],
      AHORA,
    )
    expect(r.asignados[0]?.hint).toEqual({
      tipo: "COMENZAR_POR",
      texto: "Comienza por: Intro Git",
    })
  })

  it("EN_PROGRESO → SIGUIENTE con el modulo activo", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          asignaciones: [
            { moduloId: "m1", tipo: "OBLIGATORIO", orden: 0, tituloModulo: "Intro" },
            { moduloId: "m2", tipo: "OBLIGATORIO", orden: 1, tituloModulo: "Branching" },
          ],
          estadosModulo: [
            { moduloId: "m1", estado: "COMPLETADO", porcentajeAvance: 100 },
            { moduloId: "m2", estado: "EN_PROGRESO", porcentajeAvance: 40 },
          ],
        }),
      ],
      AHORA,
    )
    expect(r.asignados[0]?.hint).toEqual({ tipo: "SIGUIENTE", texto: "Branching" })
  })

  it("COMPLETADO con excelencia → texto especial", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "COMPLETADA",
          completadaAt: diasAtras(2),
          notaGlobal: 92,
        }),
      ],
      AHORA,
    )
    expect(r.asignados[0]?.hint.tipo).toBe("NOTA_FINAL")
    expect(r.asignados[0]?.hint.texto).toContain("Excelencia")
  })

  it("ABANDONADO LIBRE → hint ABANDONADO", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "LIBRE",
          estado: "ABANDONADA",
          abandonadaAt: diasAtras(15),
        }),
      ],
      AHORA,
    )
    expect(r.libres[0]?.hint.tipo).toBe("ABANDONADO")
  })
})

describe("flags visuales", () => {
  it("recienAsignado: SOLICITUD ACTIVA, sin estados, < 7 dias", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          inscritaAt: diasAtras(2),
          estadosModulo: [],
        }),
      ],
      AHORA,
    )
    expect(r.asignados[0]?.recienAsignado).toBe(true)
  })

  it("NO recienAsignado si ya tiene estadosModulo (ya entró)", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          inscritaAt: diasAtras(1),
          asignaciones: [{ moduloId: "m1", tipo: "OBLIGATORIO", orden: 0, tituloModulo: "M1" }],
          estadosModulo: [{ moduloId: "m1", estado: "EN_PROGRESO", porcentajeAvance: 5 }],
        }),
      ],
      AHORA,
    )
    expect(r.asignados[0]?.recienAsignado).toBe(false)
  })

  it("recienCompletado: COMPLETADA con completadaAt <= 7 dias", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "COMPLETADA",
          completadaAt: diasAtras(3),
          notaGlobal: 80,
        }),
      ],
      AHORA,
    )
    expect(r.asignados[0]?.recienCompletado).toBe(true)
  })

  it("cliente solo se expone en SOLICITUD COMPLETADA", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
        }),
        fixture({
          id: "b",
          tipo: "SOLICITUD",
          estado: "COMPLETADA",
          completadaAt: diasAtras(50),
          notaGlobal: 80,
        }),
        fixture({
          id: "c",
          tipo: "LIBRE",
          estado: "COMPLETADA",
          completadaAt: diasAtras(50),
          notaGlobal: 80,
        }),
      ],
      AHORA,
    )
    const activa = r.asignados.find((c) => c.inscripcionId === "a")
    const completadaSol = r.asignados.find((c) => c.inscripcionId === "b")
    const completadaLibre = r.libres.find((c) => c.inscripcionId === "c")
    expect(activa?.cliente).toBeNull()
    expect(completadaSol?.cliente).toBe("Empresa XYZ")
    expect(completadaLibre?.cliente).toBeNull()
  })
})

describe("href y derivados visuales", () => {
  it("href usa el slug del curso", () => {
    const r = construirRespuesta([fixture({ id: "a", tipo: "SOLICITUD", estado: "ACTIVA" })], AHORA)
    expect(r.asignados[0]?.href).toBe("/cursos/git-fundamentals")
    expect(r.asignados[0]?.id).toBe("git-fundamentals")
  })

  it("icono se deriva del slug (git → git)", () => {
    const r = construirRespuesta([fixture({ id: "a", tipo: "SOLICITUD", estado: "ACTIVA" })], AHORA)
    expect(r.asignados[0]?.icono).toBe("git")
  })

  it("nivel BASICO si titulo contiene 'fundamentals'", () => {
    const r = construirRespuesta([fixture({ id: "a", tipo: "SOLICITUD", estado: "ACTIVA" })], AHORA)
    expect(r.asignados[0]?.nivel).toBe("BASICO")
  })

  it("nivel AVANZADO si titulo contiene 'avanzado'", () => {
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          curso: {
            id: "c",
            slug: "react-avanzado",
            titulo: "React Avanzado",
            descripcion: null,
            empresaCliente: "X",
          },
        }),
      ],
      AHORA,
    )
    expect(r.asignados[0]?.nivel).toBe("AVANZADO")
  })

  it("descripcionCorta truncada si > 160 chars", () => {
    const desc = "a".repeat(200)
    const r = construirRespuesta(
      [
        fixture({
          id: "a",
          tipo: "SOLICITUD",
          estado: "ACTIVA",
          curso: {
            id: "c",
            slug: "git-fundamentals",
            titulo: "T",
            descripcion: desc,
            empresaCliente: "X",
          },
        }),
      ],
      AHORA,
    )
    const card = r.asignados[0]
    expect(card?.descripcionCorta.length).toBeLessThanOrEqual(160)
    expect(card?.descripcionCorta.endsWith("...")).toBe(true)
  })
})
