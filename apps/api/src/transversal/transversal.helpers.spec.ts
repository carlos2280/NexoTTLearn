import { Prisma } from "@prisma/client"
import { describe, expect, it } from "vitest"
import { toIntentoAdmin } from "./transversal.helpers"
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

function buildIntento(evaluacionesCapas: Prisma.JsonValue): IntentoTransversalSeleccionado {
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
    colaborador: { id: "33333333-3333-3333-3333-333333333333", nombre: "Juan", email: "j@x.com" },
    transversal: {
      id: "22222222-2222-2222-2222-222222222222",
      descripcion: "Proyecto transversal",
      umbralAprobacion: new Prisma.Decimal(70),
      curso: { id: "44444444-4444-4444-4444-444444444444", titulo: "Curso" },
    },
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
