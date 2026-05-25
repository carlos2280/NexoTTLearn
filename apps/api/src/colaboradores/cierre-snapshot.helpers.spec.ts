import { describe, expect, it } from "vitest"
import {
  etiquetaCualitativaPorNota,
  parseCierreSnapshot,
  parseCierreSnapshotMinimo,
  resolverNotaGlobalFinal,
} from "./cierre-snapshot.helpers"

describe("resolverNotaGlobalFinal", () => {
  it("camino principal: devuelve notaGlobalFinal persistida", () => {
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notaGlobalFinal: 87,
        notasPorSkill: [],
      }),
    ).toBe(87)
  })

  it("notaGlobalFinal=0 persistida se respeta (no se trata como falsy)", () => {
    // Edge clasico: usar `if (fila.notaGlobalFinal)` confundiria 0 con ausencia.
    // El helper hace `typeof === 'number'`, asi que 0 debe sobrevivir.
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notaGlobalFinal: 0,
        notasPorSkill: [
          { skillId: "s1", notaActual: 90, umbralCumple: 70, caracter: "OBLIGATORIA" },
        ],
      }),
    ).toBe(0)
  })

  it("la nota persistida prevalece sobre el promedio de notasPorSkill", () => {
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notaGlobalFinal: 50,
        notasPorSkill: [
          { skillId: "s1", notaActual: 100, umbralCumple: 70, caracter: "OBLIGATORIA" },
          { skillId: "s2", notaActual: 100, umbralCumple: 70, caracter: "OBLIGATORIA" },
        ],
      }),
    ).toBe(50)
  })

  it("fallback con caracter: promedia solo OBLIGATORIAS", () => {
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notasPorSkill: [
          { skillId: "s1", notaActual: 80, umbralCumple: 70, caracter: "OBLIGATORIA" },
          { skillId: "s2", notaActual: 60, umbralCumple: 70, caracter: "OBLIGATORIA" },
          { skillId: "s3", notaActual: 100, umbralCumple: 70, caracter: "OPCIONAL" },
        ],
      }),
    ).toBe(70)
  })

  it("fallback sin caracter (snapshot muy legacy): promedia todas las notas no nulas", () => {
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notasPorSkill: [
          { skillId: "s1", notaActual: 70, umbralCumple: 70 },
          { skillId: "s2", notaActual: 90, umbralCumple: 70 },
        ],
      }),
    ).toBe(80)
  })

  it("fallback redondea al entero mas cercano", () => {
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notasPorSkill: [
          { skillId: "s1", notaActual: 70, umbralCumple: 70 },
          { skillId: "s2", notaActual: 71, umbralCumple: 70 },
          { skillId: "s3", notaActual: 72, umbralCumple: 70 },
        ],
      }),
    ).toBe(71)
  })

  it("ignora notas con notaActual=null en el fallback", () => {
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notasPorSkill: [
          { skillId: "s1", notaActual: 80, umbralCumple: 70 },
          { skillId: "s2", notaActual: null, umbralCumple: 70 },
        ],
      }),
    ).toBe(80)
  })

  it("sin nota persistida y sin notas validas: devuelve null", () => {
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notasPorSkill: [{ skillId: "s1", notaActual: null, umbralCumple: 70 }],
      }),
    ).toBeNull()
  })

  it("sin notasPorSkill: devuelve null (no inventa 0)", () => {
    expect(resolverNotaGlobalFinal({ asignacionId: "a", notasPorSkill: [] })).toBeNull()
  })

  it("snapshot legacy con notas mixtas (algunas con caracter, otras sin): el some() activa el filtro OBLIGATORIA y excluye las sin caracter", () => {
    // Rama logica del helper: `conCaracter = some(...)` se activa con una sola
    // nota que tenga `caracter`, asi que las notas sin `caracter` se tratan
    // como NO-OBLIGATORIA y quedan fuera del promedio. Es el comportamiento
    // esperado (datos a medio migrar -> prevalece la senal explicita).
    expect(
      resolverNotaGlobalFinal({
        asignacionId: "a",
        notasPorSkill: [
          { skillId: "s1", notaActual: 80, umbralCumple: 70, caracter: "OBLIGATORIA" },
          { skillId: "s2", notaActual: 100, umbralCumple: 70 }, // sin caracter -> excluida
        ],
      }),
    ).toBe(80)
  })
})

describe("parseCierreSnapshotMinimo", () => {
  it("devuelve null si el snapshot no es objeto", () => {
    expect(parseCierreSnapshotMinimo(null)).toBeNull()
    expect(parseCierreSnapshotMinimo(undefined)).toBeNull()
    expect(parseCierreSnapshotMinimo("texto")).toBeNull()
    expect(parseCierreSnapshotMinimo([])).toBeNull()
  })

  it("devuelve null si falta asignaciones", () => {
    expect(parseCierreSnapshotMinimo({ otroCampo: 1 })).toBeNull()
  })

  it("devuelve null si asignaciones no es array", () => {
    expect(parseCierreSnapshotMinimo({ asignaciones: "no soy array" })).toBeNull()
  })

  it("devuelve null si una asignacion no tiene asignacionId", () => {
    expect(parseCierreSnapshotMinimo({ asignaciones: [{ notasPorSkill: [] }] })).toBeNull()
  })

  it("acepta asignacion sin notasPorSkill (legacy) y lo defaultea a []", () => {
    const parsed = parseCierreSnapshotMinimo({
      asignaciones: [{ asignacionId: "a" }],
    })
    expect(parsed).not.toBeNull()
    expect(parsed?.asignaciones[0]?.notasPorSkill).toEqual([])
  })

  it("preserva campos extra del snapshot via passthrough", () => {
    const parsed = parseCierreSnapshotMinimo({
      asignaciones: [
        {
          asignacionId: "a",
          notasPorSkill: [{ skillId: "s1", notaActual: 80, umbralCumple: 70 }],
        },
      ],
      versionSnapshot: 1,
      timestampCierre: "2026-05-17",
    })
    expect(parsed).not.toBeNull()
    expect((parsed as Record<string, unknown>).versionSnapshot).toBe(1)
  })
})

describe("parseCierreSnapshot (schema completo)", () => {
  const snapshotValido = {
    curso: {
      titulo: "Java Senior",
      configuracion: { skillsExigidas: [{ skillId: "s1" }] },
    },
    asignaciones: [
      {
        asignacionId: "a",
        resultadoFinal: "APTO",
        notaGlobalFinal: 85,
        notasPorSkill: [{ skillId: "s1", notaActual: 85, umbralCumple: 70 }],
      },
    ],
  }

  it("parsea snapshot bien formado", () => {
    const parsed = parseCierreSnapshot(snapshotValido)
    expect(parsed?.curso.titulo).toBe("Java Senior")
    expect(parsed?.asignaciones[0]?.notaGlobalFinal).toBe(85)
  })

  it("devuelve null si falta curso.titulo", () => {
    const sinTitulo = {
      ...snapshotValido,
      curso: { configuracion: { skillsExigidas: [] } },
    }
    expect(parseCierreSnapshot(sinTitulo)).toBeNull()
  })

  it("devuelve null si falta curso.configuracion.skillsExigidas", () => {
    const sinSkills = {
      ...snapshotValido,
      curso: { titulo: "X", configuracion: {} },
    }
    expect(parseCierreSnapshot(sinSkills)).toBeNull()
  })

  it("passthrough acepta campos extra desconocidos sin romper (anti-regresion)", () => {
    // Defensa anti-regresion: si alguien cambia el schema a `.strict()` sin
    // querer, este test peta. El snapshot real lo escribe el back y puede
    // crecer (telemetria, metadatos de cierre) — el lector NO debe romperse
    // por campos extra.
    const conExtras = {
      ...snapshotValido,
      versionSnapshot: 99,
      timestampCierre: "2026-05-17T18:00:00Z",
      metricasInternas: { algoNuevo: 42 },
      curso: {
        ...snapshotValido.curso,
        autorCierre: "admin@nexott.local",
      },
      asignaciones: snapshotValido.asignaciones.map((a) => ({
        ...a,
        flagInterno: true,
      })),
    }
    const parsed = parseCierreSnapshot(conExtras)
    expect(parsed).not.toBeNull()
    expect(parsed?.curso.titulo).toBe("Java Senior")
    expect(parsed?.asignaciones[0]?.notaGlobalFinal).toBe(85)
  })
})

describe("etiquetaCualitativaPorNota", () => {
  it.each([
    [100, "excelencia"],
    [85, "excelencia"],
    [84, "solido"],
    [70, "solido"],
    [69, "enDesarrollo"],
    [50, "enDesarrollo"],
    [49, "noCumple"],
    [0, "noCumple"],
  ])("nota %d -> %s", (nota, esperada) => {
    expect(etiquetaCualitativaPorNota(nota)).toBe(esperada)
  })
})
