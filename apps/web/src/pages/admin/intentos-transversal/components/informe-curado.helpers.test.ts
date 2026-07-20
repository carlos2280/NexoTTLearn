import type { IntentoTransversalAdminResponse, RevisionIa } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  baseParaCurar,
  construirReporteFinal,
  esCurable,
  esResumenVacio,
  estadoInicialCuracion,
  hayFilasIncompletas,
} from "./informe-curado.helpers"

function intentoConInformes(
  reporteFinal: RevisionIa | null,
  revisionIa: RevisionIa | null,
): IntentoTransversalAdminResponse {
  return { reporteFinal, revisionIa } as unknown as IntentoTransversalAdminResponse
}

describe("esCurable", () => {
  it("solo EVALUADO es curable", () => {
    expect(esCurable("EVALUADO")).toBe(true)
    expect(esCurable("EN_EVALUACION")).toBe(false)
    expect(esCurable("FINALIZADO")).toBe(false)
    expect(esCurable("ANULADO")).toBe(false)
    expect(esCurable("FALLO_ACCESO_REPO")).toBe(false)
  })
})

describe("baseParaCurar", () => {
  const final: RevisionIa = { comentario: "final", confianza: "ALTA" }
  const crudo: RevisionIa = { comentario: "crudo", confianza: "BAJA" }

  it("prefiere reporteFinal sobre revisionIa", () => {
    expect(baseParaCurar(intentoConInformes(final, crudo))?.comentario).toBe("final")
  })
  it("cae al revisionIa crudo si no hay reporteFinal (intento legacy)", () => {
    expect(baseParaCurar(intentoConInformes(null, crudo))?.comentario).toBe("crudo")
  })
  it("null si no hay ninguno (capa sin cargar)", () => {
    expect(baseParaCurar(intentoConInformes(null, null))).toBeNull()
  })
})

describe("estadoInicialCuracion", () => {
  it("extrae resumen + aReforzar de la base", () => {
    const base: RevisionIa = {
      comentario: "c",
      confianza: "MEDIA",
      resumen: "resumen",
      aReforzar: [{ que: "tests", sugerencia: "casos borde" }],
    }
    expect(estadoInicialCuracion(base)).toEqual({
      resumen: "resumen",
      aReforzar: [{ que: "tests", sugerencia: "casos borde" }],
    })
  })
  it("vacío si la base es null o no trae esos campos", () => {
    expect(estadoInicialCuracion(null)).toEqual({ resumen: "", aReforzar: [] })
    expect(estadoInicialCuracion({ comentario: "c", confianza: "ALTA" })).toEqual({
      resumen: "",
      aReforzar: [],
    })
  })
})

describe("construirReporteFinal", () => {
  const base: RevisionIa = {
    comentario: "crudo",
    confianza: "ALTA",
    veredicto: "necesita_ajustes",
    resumen: "resumen viejo",
    queReviso: "estructura",
    porDimension: [{ dimension: "TS", nota: 50, comentario: "ok" }],
    fortalezas: ["estructura clara"],
    aReforzar: [{ que: "viejo", sugerencia: "viejo" }],
  }

  it("pisa resumen + aReforzar y PRESERVA todo lo no curado", () => {
    const res = construirReporteFinal(base, {
      resumen: "  resumen nuevo  ",
      aReforzar: [{ que: " cobertura ", sugerencia: " sube a 80% " }],
    })
    expect(res.resumen).toBe("resumen nuevo")
    expect(res.aReforzar).toEqual([{ que: "cobertura", sugerencia: "sube a 80%" }])
    // Lo que el admin NO cura queda intacto (evidencia + campos crudos).
    expect(res.comentario).toBe("crudo")
    expect(res.confianza).toBe("ALTA")
    expect(res.veredicto).toBe("necesita_ajustes")
    expect(res.queReviso).toBe("estructura")
    expect(res.porDimension).toEqual([{ dimension: "TS", nota: 50, comentario: "ok" }])
    expect(res.fortalezas).toEqual(["estructura clara"])
  })

  it("descarta filas de a reforzar vacías o incompletas (el backend exige ambos)", () => {
    const res = construirReporteFinal(base, {
      resumen: "x",
      aReforzar: [
        { que: "completa", sugerencia: "ok" },
        { que: "", sugerencia: "" },
        { que: "solo que", sugerencia: "" },
      ],
    })
    expect(res.aReforzar).toEqual([{ que: "completa", sugerencia: "ok" }])
  })

  it("campos vacíos viajan como undefined (se omiten del JSON, coherente con optional)", () => {
    const res = construirReporteFinal(base, { resumen: "   ", aReforzar: [] })
    expect(res.resumen).toBeUndefined()
    expect(res.aReforzar).toBeUndefined()
  })

  it("HTML de TipTap vacío ('<p></p>') NO se persiste; con texto sí", () => {
    expect(
      construirReporteFinal(base, { resumen: "<p></p>", aReforzar: [] }).resumen,
    ).toBeUndefined()
    expect(
      construirReporteFinal(base, { resumen: "<p>Buen trabajo</p>", aReforzar: [] }).resumen,
    ).toBe("<p>Buen trabajo</p>")
  })

  it("usa un cimiento mínimo válido si la base es null (intento legacy)", () => {
    const res = construirReporteFinal(null, { resumen: "hola", aReforzar: [] })
    expect(res.comentario).toBe("")
    expect(res.confianza).toBe("MEDIA")
    expect(res.resumen).toBe("hola")
  })
})

describe("esResumenVacio", () => {
  it("true para cadena vacía y HTML sin texto visible", () => {
    expect(esResumenVacio("")).toBe(true)
    expect(esResumenVacio("<p></p>")).toBe(true)
    expect(esResumenVacio("<p>   </p>")).toBe(true)
    expect(esResumenVacio("<p>&nbsp;</p>")).toBe(true)
    expect(esResumenVacio("<p><br></p>")).toBe(true)
    expect(esResumenVacio("<ul><li></li></ul>")).toBe(true)
  })
  it("false cuando hay texto real (aunque esté envuelto en tags)", () => {
    expect(esResumenVacio("<p>Buen trabajo</p>")).toBe(false)
    expect(esResumenVacio("texto plano")).toBe(false)
    expect(esResumenVacio("<ul><li>casos borde</li></ul>")).toBe(false)
  })
})

describe("hayFilasIncompletas", () => {
  it("true si una fila tiene exactamente uno de los dos campos", () => {
    expect(hayFilasIncompletas([{ que: "x", sugerencia: "" }])).toBe(true)
    expect(hayFilasIncompletas([{ que: "", sugerencia: "y" }])).toBe(true)
  })
  it("false si ambas llenas, ambas vacías, o lista vacía", () => {
    expect(hayFilasIncompletas([{ que: "x", sugerencia: "y" }])).toBe(false)
    expect(hayFilasIncompletas([{ que: "  ", sugerencia: "  " }])).toBe(false)
    expect(hayFilasIncompletas([])).toBe(false)
  })
})
