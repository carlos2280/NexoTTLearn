import { describe, expect, it } from "vitest"
import { type CursoParaChecklist, evaluarChecklistPublicacion } from "./cursos.checklist"

// Tests del evaluador puro del checklist de publicacion.
// No tocan Prisma — operan sobre la forma minima `CursoParaChecklist`.
// Cubren las 10 reglas obligatorias de MAESTRO §5.1 + publicar.md §3.

const FECHA_INICIO = new Date("2026-06-01T00:00:00Z")
const FECHA_DEADLINE = new Date("2026-08-15T00:00:00Z")

// Curso "perfecto": todas las 10 reglas cumplidas. Cada test parte de aqui y
// rompe UNA regla para verificar que el evaluador la detecta aislada.
function cursoPerfecto(): CursoParaChecklist {
  return {
    empresaCliente: "Empresa XYZ",
    titulo: "Fullstack Developer",
    fechaInicio: FECHA_INICIO,
    deadline: FECHA_DEADLINE,
    pesoAreas: 70,
    pesoProyectoTransversal: 20,
    pesoEntrevistaIA: 10,
    pesoActividades: 70,
    pesoMiniProyecto: 30,
    umbralExcelencia: 90,
    umbralAprobado: 70,
    umbralEnDesarrollo: 50,
    cursoAreas: [
      { areaId: "area-frontend", peso: 50, puntajeObjetivo: 70 },
      { areaId: "area-backend", peso: 50, puntajeObjetivo: 70 },
    ],
    modulos: [
      {
        id: "mod-1",
        areaId: "area-frontend",
        miniProyectoActivo: true,
        secciones: [{ id: "sec-1", bloques: [{ id: "blq-1" }] }],
      },
      {
        id: "mod-2",
        areaId: "area-backend",
        miniProyectoActivo: false,
        secciones: [{ id: "sec-2", bloques: [{ id: "blq-2" }] }],
      },
    ],
    proyectoTransversalActivo: true,
    entrevistaIAActiva: true,
  }
}

describe("evaluarChecklistPublicacion · curso perfecto", () => {
  it("todoCumplido=true cuando las 10 reglas pasan", () => {
    const r = evaluarChecklistPublicacion(cursoPerfecto())
    expect(r.todoCumplido).toBe(true)
    expect(r.faltantes).toHaveLength(0)
    expect(r.cumplidos).toHaveLength(10)
    expect(r.resumen).toMatchObject({
      areas: 2,
      modulos: 2,
      secciones: 2,
      bloques: 2,
      miniActivos: 1,
      transversalActivo: true,
      entrevistaActiva: true,
    })
  })
})

describe("evaluarChecklistPublicacion · cada falta dispara su item", () => {
  it("cliente_titulo: empresa vacia", () => {
    const r = evaluarChecklistPublicacion({ ...cursoPerfecto(), empresaCliente: "  " })
    expect(r.faltantes.find((f) => f.id === "cliente_titulo")).toBeDefined()
    expect(r.faltantes.find((f) => f.id === "cliente_titulo")?.ctaTarget).toBe("identidad")
  })

  it("cliente_titulo: titulo vacio", () => {
    const r = evaluarChecklistPublicacion({ ...cursoPerfecto(), titulo: "   " })
    expect(r.faltantes.find((f) => f.id === "cliente_titulo")).toBeDefined()
  })

  it("fechas: deadline anterior a inicio", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      fechaInicio: FECHA_DEADLINE,
      deadline: FECHA_INICIO,
    })
    expect(r.faltantes.find((f) => f.id === "fechas")).toBeDefined()
    expect(r.faltantes.find((f) => f.id === "fechas")?.ctaTarget).toBe("fechas")
  })

  it("fechas: ninguna declarada", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      fechaInicio: null,
      deadline: null,
    })
    expect(r.faltantes.find((f) => f.id === "fechas")).toBeDefined()
  })

  it("areas_min_1: cero areas", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      cursoAreas: [],
      modulos: [],
    })
    expect(r.faltantes.find((f) => f.id === "areas_min_1")).toBeDefined()
  })

  it("areas_pesos_100: suma 99", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      cursoAreas: [
        { areaId: "area-frontend", peso: 49, puntajeObjetivo: 70 },
        { areaId: "area-backend", peso: 50, puntajeObjetivo: 70 },
      ],
    })
    const item = r.faltantes.find((f) => f.id === "areas_pesos_100")
    expect(item).toBeDefined()
    expect(item?.detalle).toContain("99")
  })

  it("areas_objetivo: puntajeObjetivo fuera de rango", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      cursoAreas: [
        { areaId: "area-frontend", peso: 50, puntajeObjetivo: 0 },
        { areaId: "area-backend", peso: 50, puntajeObjetivo: 70 },
      ],
    })
    expect(r.faltantes.find((f) => f.id === "areas_objetivo")).toBeDefined()
  })

  it("area_tiene_modulo: area sin modulo", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      modulos: [
        {
          id: "mod-1",
          areaId: "area-frontend",
          miniProyectoActivo: false,
          secciones: [{ id: "s", bloques: [{ id: "b" }] }],
        },
        // Falta modulo para area-backend
      ],
    })
    expect(r.faltantes.find((f) => f.id === "area_tiene_modulo")).toBeDefined()
  })

  it("modulo_tiene_contenido: modulo sin secciones con bloques", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      modulos: [
        {
          id: "mod-1",
          areaId: "area-frontend",
          miniProyectoActivo: false,
          secciones: [{ id: "s", bloques: [] }],
        },
        {
          id: "mod-2",
          areaId: "area-backend",
          miniProyectoActivo: false,
          secciones: [{ id: "s2", bloques: [{ id: "b" }] }],
        },
      ],
    })
    const item = r.faltantes.find((f) => f.id === "modulo_tiene_contenido")
    expect(item).toBeDefined()
    expect(item?.ctaTarget).toEqual({ tipo: "modulo", moduloId: "mod-1" })
  })

  it("pesos_intra_modulo: con mini activo, suma 99", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      pesoActividades: 70,
      pesoMiniProyecto: 29,
    })
    expect(r.faltantes.find((f) => f.id === "pesos_intra_modulo")).toBeDefined()
  })

  it("pesos_intra_modulo: sin mini, actividades=100 cumple aunque mini=30", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      pesoActividades: 100,
      pesoMiniProyecto: 30,
      modulos: [
        {
          id: "mod-1",
          areaId: "area-frontend",
          miniProyectoActivo: false,
          secciones: [{ id: "s", bloques: [{ id: "b" }] }],
        },
        {
          id: "mod-2",
          areaId: "area-backend",
          miniProyectoActivo: false,
          secciones: [{ id: "s2", bloques: [{ id: "b2" }] }],
        },
      ],
    })
    expect(r.faltantes.find((f) => f.id === "pesos_intra_modulo")).toBeUndefined()
  })

  it("pesos_curso_100: con transversal y entrevista activos suma 99", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      pesoAreas: 70,
      pesoProyectoTransversal: 20,
      pesoEntrevistaIA: 9,
    })
    expect(r.faltantes.find((f) => f.id === "pesos_curso_100")).toBeDefined()
  })

  it("pesos_curso_100: con solo areas activas, suma 100", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      pesoAreas: 100,
      pesoProyectoTransversal: 0,
      pesoEntrevistaIA: 0,
      proyectoTransversalActivo: false,
      entrevistaIAActiva: false,
    })
    expect(r.faltantes.find((f) => f.id === "pesos_curso_100")).toBeUndefined()
  })

  it("umbrales_logro: no estrictamente ascendentes", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      umbralEnDesarrollo: 70,
      umbralAprobado: 70,
      umbralExcelencia: 90,
    })
    expect(r.faltantes.find((f) => f.id === "umbrales_logro")).toBeDefined()
  })

  it("umbrales_logro: un valor fuera de [1,99]", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      umbralEnDesarrollo: 0,
    })
    expect(r.faltantes.find((f) => f.id === "umbrales_logro")).toBeDefined()
  })
})

describe("evaluarChecklistPublicacion · resumen", () => {
  it("cuenta secciones y bloques agregados", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      modulos: [
        {
          id: "m1",
          areaId: "area-frontend",
          miniProyectoActivo: true,
          secciones: [
            { id: "s1", bloques: [{ id: "b1" }, { id: "b2" }] },
            { id: "s2", bloques: [{ id: "b3" }] },
          ],
        },
        {
          id: "m2",
          areaId: "area-backend",
          miniProyectoActivo: false,
          secciones: [{ id: "s3", bloques: [{ id: "b4" }] }],
        },
      ],
    })
    expect(r.resumen.modulos).toBe(2)
    expect(r.resumen.secciones).toBe(3)
    expect(r.resumen.bloques).toBe(4)
    expect(r.resumen.miniActivos).toBe(1)
  })

  it("opcionales reportan estado de transversal y entrevista", () => {
    const r = evaluarChecklistPublicacion({
      ...cursoPerfecto(),
      proyectoTransversalActivo: false,
      entrevistaIAActiva: false,
    })
    expect(r.opcionales).toHaveLength(2)
    expect(r.opcionales[0]?.cumplido).toBe(false)
    expect(r.opcionales[1]?.cumplido).toBe(false)
  })
})
