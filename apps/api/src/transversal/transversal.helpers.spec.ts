import { Prisma } from "@prisma/client"
import { describe, expect, it } from "vitest"
import { toIntentoAdmin, toIntentoParticipante } from "./transversal.helpers"
import { IntentoTransversalSeleccionado } from "./transversal.types"

const REVISION_IA_VALIDA = {
  comentario: "Estructura clara.",
  confianza: "ALTA",
  veredicto: "apto",
  resumen: "Buen trabajo general.",
  queReviso: "estructura, tests",
  queNoReviso: "no ejecuto el codigo",
  porDimension: [{ dimension: "TypeScript", nota: 88, comentario: "solido" }],
  fortalezas: ["estructura clara"],
  aReforzar: [{ que: "tests", sugerencia: "casos borde" }],
}

function buildIntento(
  evaluacionesCapas: Prisma.JsonValue,
  extra: Record<string, unknown> = {},
): IntentoTransversalSeleccionado {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    transversalId: "22222222-2222-2222-2222-222222222222",
    colaboradorId: "33333333-3333-3333-3333-333333333333",
    fecha: new Date("2026-07-12T12:00:00.000Z"),
    estado: "EVALUADO",
    anulado: false,
    motivoAnulacion: null,
    repoUrl: "https://github.com/foo/bar",
    repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar" },
    comentarioColaborador: "listo",
    notaCapaTests: null,
    notaCapaCualitativa: new Prisma.Decimal(88),
    notaCapaComprension: null,
    notaGlobal: null,
    aprobado: null,
    evaluacionesCapas,
    reporteIa: null,
    reporteFinal: null,
    evidenciaRepo: null,
    validadoPor: null,
    fechaValidacion: null,
    colaborador: { id: "33333333-3333-3333-3333-333333333333", nombre: "Juan", email: "j@x.com" },
    transversal: {
      id: "22222222-2222-2222-2222-222222222222",
      descripcion: "Proyecto transversal",
      umbralAprobacion: new Prisma.Decimal(70),
      curso: { id: "44444444-4444-4444-4444-444444444444", titulo: "Curso" },
    },
    ...extra,
  } as unknown as IntentoTransversalSeleccionado
}

describe("toIntentoAdmin — revisionIa", () => {
  it("expone el informe cuando evaluacionesCapas.cualitativa es válido", () => {
    const res = toIntentoAdmin(buildIntento({ cualitativa: REVISION_IA_VALIDA }))
    expect(res.revisionIa).not.toBeNull()
    expect(res.revisionIa?.veredicto).toBe("apto")
    expect(res.revisionIa?.porDimension?.[0]?.dimension).toBe("TypeScript")
    expect(res.revisionIa?.confianza).toBe("ALTA")
  })

  it("acepta el detalle legacy (solo comentario + confianza)", () => {
    const res = toIntentoAdmin(
      buildIntento({ cualitativa: { comentario: "ok", confianza: "MEDIA" } }),
    )
    expect(res.revisionIa?.comentario).toBe("ok")
    expect(res.revisionIa?.veredicto).toBeUndefined()
  })

  it("devuelve null cuando la capa cualitativa aún no se cargó", () => {
    expect(toIntentoAdmin(buildIntento({})).revisionIa).toBeNull()
    expect(toIntentoAdmin(buildIntento(null)).revisionIa).toBeNull()
  })

  it("devuelve null (no lanza) ante un detalle corrupto", () => {
    const res = toIntentoAdmin(buildIntento({ cualitativa: { confianza: "INVALIDA" } }))
    expect(res.revisionIa).toBeNull()
  })
})

describe("toIntentoAdmin — curación (Fase 4b ③)", () => {
  it("expone reporteIa, reporteFinal y sello de validación", () => {
    const res = toIntentoAdmin(
      buildIntento(
        {},
        {
          reporteIa: { comentario: "crudo IA", confianza: "MEDIA" },
          reporteFinal: { comentario: "final curado", confianza: "ALTA" },
          validadoPor: "55555555-5555-5555-5555-555555555555",
          fechaValidacion: new Date("2026-07-12T13:00:00.000Z"),
        },
      ),
    )
    expect(res.reporteIa?.comentario).toBe("crudo IA")
    expect(res.reporteFinal?.comentario).toBe("final curado")
    expect(res.validadoPor).toBe("55555555-5555-5555-5555-555555555555")
    expect(res.fechaValidacion).toBe("2026-07-12T13:00:00.000Z")
  })

  it("evidenciaRepo se expone como RESUMEN (sin el contenido pesado)", () => {
    const res = toIntentoAdmin(
      buildIntento(
        {},
        {
          evidenciaRepo: {
            commit: "abc1234",
            archivos: ["index.js"],
            truncado: false,
            bytesTotales: 42,
            contenido: "no debe viajar en el detalle",
          },
        },
      ),
    )
    expect(res.evidenciaRepo).toEqual({
      commit: "abc1234",
      archivos: ["index.js"],
      truncado: false,
      bytesTotales: 42,
    })
    expect(res.evidenciaRepo).not.toHaveProperty("contenido")
  })

  it("campos de curación null cuando aún no existen", () => {
    const res = toIntentoAdmin(buildIntento({}))
    expect(res.reporteIa).toBeNull()
    expect(res.reporteFinal).toBeNull()
    expect(res.evidenciaRepo).toBeNull()
    expect(res.validadoPor).toBeNull()
    expect(res.fechaValidacion).toBeNull()
  })
})

// reporteFinal curado + TODOS los campos crudos/sensibles que NO debe ver el
// participante (B3): comentario crudo, rúbrica (porDimension), checklist de
// criterios, y el resto del RevisionIa. El fixture los incluye para probar que
// la proyección (allowlist) los poda incluso si el shape gana campos.
const CAMPOS_SENSIBLES = [
  "comentario",
  "confianza",
  "veredicto",
  "queReviso",
  "queNoReviso",
  "porDimension",
  "fortalezas",
  "cumplimientoCriterios",
] as const
const INFORME_FINAL = {
  comentario: "comentario crudo interno de la IA",
  confianza: "ALTA" as const,
  veredicto: "necesita_ajustes" as const,
  resumen: "Buen trabajo general, con puntos a pulir.",
  queReviso: "estructura y tests",
  queNoReviso: "no ejecuté el código",
  porDimension: [{ dimension: "TypeScript", nota: 80, comentario: "sólido" }],
  fortalezas: ["estructura clara"],
  aReforzar: [{ que: "cobertura de tests", sugerencia: "agrega casos borde" }],
  cumplimientoCriterios: [
    { criterio: "usa TS estricto", cumple: "cumple" as const, evidencia: "tsconfig strict" },
  ],
}

describe("toIntentoParticipante — informe final (Fase 4b ③ / B3)", () => {
  it("NO expone el informe antes de FINALIZADO (EVALUADO)", () => {
    const res = toIntentoParticipante(
      buildIntento({}, { estado: "EVALUADO", reporteFinal: INFORME_FINAL }),
    )
    expect(res.informe).toBeNull()
  })

  it("expone SOLO resumen + aReforzar del reporteFinal en FINALIZADO (proyección B3)", () => {
    const res = toIntentoParticipante(
      buildIntento({}, { estado: "FINALIZADO", reporteFinal: INFORME_FINAL }),
    )
    expect(res.informe?.resumen).toBe("Buen trabajo general, con puntos a pulir.")
    expect(res.informe?.aReforzar).toEqual([
      { que: "cobertura de tests", sugerencia: "agrega casos borde" },
    ])
    // Poda (allowlist): NINGÚN campo crudo/rúbrica/checklist viaja al participante.
    for (const campo of CAMPOS_SENSIBLES) {
      expect(res.informe).not.toHaveProperty(campo)
    }
  })

  it("informe null en FINALIZADO si el admin no curó resumen ni aReforzar", () => {
    const res = toIntentoParticipante(
      buildIntento(
        {},
        { estado: "FINALIZADO", reporteFinal: { comentario: "solo crudo", confianza: "MEDIA" } },
      ),
    )
    expect(res.informe).toBeNull()
  })

  it("nunca expone el crudo ni la evidencia", () => {
    const res = toIntentoParticipante(
      buildIntento({}, { estado: "FINALIZADO", reporteFinal: INFORME_FINAL }),
    ) as Record<string, unknown>
    expect("reporteIa" in res).toBe(false)
    expect("evidenciaRepo" in res).toBe(false)
  })
})
