// Tests del selector de vista del curso. Funcion pura: arma fixtures de
// VistaCursoData y verifica el shape del response.

import { describe, expect, it } from "vitest"
import type { VistaCursoData } from "./vista-curso.query"
import { construirVistaCurso } from "./vista-curso.selector"

const AREA_FE = {
  id: "area-fe",
  nombre: "Frontend",
  color: "#aabbcc",
  peso: 30,
  puntajeObjetivo: 70,
  orden: 0,
}
const AREA_BE = {
  id: "area-be",
  nombre: "Backend",
  color: "#112233",
  peso: 40,
  puntajeObjetivo: 70,
  orden: 1,
}

const MODULO_FE = {
  id: "m-fe",
  titulo: "React Basics",
  orden: 0,
  areaId: AREA_FE.id,
  cantidadSecciones: 3,
  cantidadBloques: 12,
  miniProyecto: null,
}
const MODULO_BE = {
  id: "m-be",
  titulo: "REST API",
  orden: 1,
  areaId: AREA_BE.id,
  cantidadSecciones: 4,
  cantidadBloques: 15,
  miniProyecto: { id: "mini-be", titulo: "Build an API", umbralAprobacion: 70 },
}

function fixture(overrides: Partial<VistaCursoData> = {}): VistaCursoData {
  return {
    inscripcionId: "ins-1",
    tipoInscripcion: "SOLICITUD",
    estadoInscripcion: "ACTIVA",
    inscritaAt: new Date("2026-04-01T00:00:00Z"),
    completadaAt: null,
    abandonadaAt: null,
    notaGlobal: null,
    curso: {
      id: "curso-uuid",
      slug: "fullstack-xyz",
      titulo: "Fullstack Developer XYZ",
      descripcion: "Curso integral fullstack.",
      empresaCliente: "Empresa XYZ",
      fechaInicio: new Date("2026-04-01T00:00:00Z"),
      deadline: null,
    },
    areas: [AREA_FE, AREA_BE],
    modulos: [MODULO_FE, MODULO_BE],
    asignaciones: [
      { moduloId: MODULO_FE.id, tipo: "OBLIGATORIO" },
      { moduloId: MODULO_BE.id, tipo: "OBLIGATORIO" },
    ],
    estadosModulo: [],
    entregasMini: [],
    transversal: null,
    entregasTransversal: [],
    entrevistaConfig: null,
    sesionesEntrevista: [],
    bloquesInteractuados: 0,
    horasDedicadas: 0,
    ...overrides,
  }
}

describe("construirVistaCurso · estado del curso", () => {
  it("RECIEN_INSCRITO si ACTIVA y sin estadosModulo", () => {
    const r = construirVistaCurso(fixture())
    expect(r.estado).toBe("RECIEN_INSCRITO")
  })

  it("ACTIVO con avance", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_FE.id,
            estado: "EN_PROGRESO",
            porcentajeAvance: 30,
            completadoAt: null,
          },
        ],
      }),
    )
    expect(r.estado).toBe("ACTIVO")
  })

  it("COMPLETADO si la inscripcion lo esta", () => {
    const r = construirVistaCurso(
      fixture({
        estadoInscripcion: "COMPLETADA",
        completadaAt: new Date("2026-05-01T00:00:00Z"),
        notaGlobal: 92,
        estadosModulo: [
          {
            moduloId: MODULO_FE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
          {
            moduloId: MODULO_BE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
        ],
      }),
    )
    expect(r.estado).toBe("COMPLETADO")
    expect(r.hero.excelencia).toBe(true)
    expect(r.hero.gradiente).toBe("spectral")
    expect(r.hero.porcentajeProgreso).toBe(100)
  })

  it("ABANDONADO en LIBRE", () => {
    const r = construirVistaCurso(
      fixture({ tipoInscripcion: "LIBRE", estadoInscripcion: "ABANDONADA" }),
    )
    expect(r.estado).toBe("ABANDONADO")
    expect(r.hero.permiteAbandonar).toBe(false)
    expect(r.hero.siguientePaso.variante).toBe("NINGUNO")
  })
})

describe("hero", () => {
  it("permiteAbandonar solo en LIBRE ACTIVA", () => {
    expect(
      construirVistaCurso(fixture({ tipoInscripcion: "SOLICITUD" })).hero.permiteAbandonar,
    ).toBe(false)
    expect(construirVistaCurso(fixture({ tipoInscripcion: "LIBRE" })).hero.permiteAbandonar).toBe(
      true,
    )
  })

  it("siguientePaso=MODULO con CTA Comenzar para RECIEN_INSCRITO", () => {
    const r = construirVistaCurso(fixture())
    expect(r.hero.siguientePaso.variante).toBe("MODULO")
    expect(r.hero.siguientePaso.cta).toBe("Comenzar")
    expect(r.hero.siguientePaso.moduloId).toBe(MODULO_FE.id) // primer obligatorio
  })

  it("siguientePaso=MODULO con CTA Continuar si EN_PROGRESO", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_FE.id,
            estado: "EN_PROGRESO",
            porcentajeAvance: 50,
            completadoAt: null,
          },
        ],
      }),
    )
    expect(r.hero.siguientePaso.cta).toBe("Continuar")
    expect(r.hero.siguientePaso.moduloId).toBe(MODULO_FE.id)
  })

  it("progreso ponderado por peso del area", () => {
    // FE peso 30 al 100%, BE peso 40 al 0% → (100*30 + 0*40) / (30+40) = 42.85 → 43
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_FE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
        ],
      }),
    )
    expect(r.hero.porcentajeProgreso).toBe(43)
  })

  it("KPIs cuentan modulos completados y nota promedio", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_FE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
          {
            moduloId: MODULO_BE.id,
            estado: "EN_PROGRESO",
            porcentajeAvance: 30,
            completadoAt: null,
          },
        ],
      }),
    )
    expect(r.hero.kpis.modulosCompletados).toBe(1)
    expect(r.hero.kpis.modulosAsignados).toBe(2)
    // Sin mini en FE → fallback 70
    expect(r.hero.kpis.notaPromedio).toBe(70)
  })

  it("siguientePaso=EXPEDIENTE en COMPLETADO", () => {
    const r = construirVistaCurso(
      fixture({
        estadoInscripcion: "COMPLETADA",
        completadaAt: new Date(),
        notaGlobal: 80,
      }),
    )
    expect(r.hero.siguientePaso.variante).toBe("EXPEDIENTE")
    expect(r.hero.siguientePaso.cta).toBe("Ver expediente")
    expect(r.hero.siguientePaso.href).toContain("/expediente#")
  })
})

describe("areas", () => {
  it("solo aparecen areas con modulos asignados", () => {
    // BE sin asignacion: area BE NO debe aparecer.
    const r = construirVistaCurso(
      fixture({
        asignaciones: [{ moduloId: MODULO_FE.id, tipo: "OBLIGATORIO" }],
      }),
    )
    expect(r.areas).toHaveLength(1)
    expect(r.areas[0]?.id).toBe(AREA_FE.id)
  })

  it("estado area CUMPLIDO si todos OBLIG completados con nota >= umbral", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_FE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
          {
            moduloId: MODULO_BE.id,
            estado: "EN_PROGRESO",
            porcentajeAvance: 50,
            completadoAt: null,
          },
        ],
      }),
    )
    const fe = r.areas.find((a) => a.id === AREA_FE.id)
    const be = r.areas.find((a) => a.id === AREA_BE.id)
    expect(fe?.estado).toBe("CUMPLIDO")
    expect(be?.estado).toBe("EN_PROGRESO")
  })

  it("SIN_INICIAR si no hay avance en ningun modulo del area", () => {
    const r = construirVistaCurso(fixture())
    expect(r.areas[0]?.estado).toBe("SIN_INICIAR")
  })

  it("SIN_OBLIGACION si solo hay OPCIONAL en el area", () => {
    const r = construirVistaCurso(
      fixture({
        asignaciones: [
          { moduloId: MODULO_FE.id, tipo: "OPCIONAL" },
          { moduloId: MODULO_BE.id, tipo: "OBLIGATORIO" },
        ],
      }),
    )
    const fe = r.areas.find((a) => a.id === AREA_FE.id)
    expect(fe?.estado).toBe("SIN_OBLIGACION")
  })

  it("modulo con esSiguientePaso=true es el del CTA Continuar", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_BE.id,
            estado: "EN_PROGRESO",
            porcentajeAvance: 40,
            completadoAt: null,
          },
        ],
      }),
    )
    const todos = r.areas.flatMap((a) => a.modulos)
    expect(todos.find((m) => m.id === MODULO_BE.id)?.esSiguientePaso).toBe(true)
    expect(todos.find((m) => m.id === MODULO_FE.id)?.esSiguientePaso).toBe(false)
  })

  it("LIBRE convierte tag de asignacion a OPCIONAL_LIBRE", () => {
    const r = construirVistaCurso(
      fixture({
        tipoInscripcion: "LIBRE",
        asignaciones: [
          { moduloId: MODULO_FE.id, tipo: "OPCIONAL" },
          { moduloId: MODULO_BE.id, tipo: "OPCIONAL" },
        ],
      }),
    )
    const todos = r.areas.flatMap((a) => a.modulos)
    expect(todos.every((m) => m.tagAsignacion === "OPCIONAL_LIBRE")).toBe(true)
  })
})

describe("mini proyecto sub-fila", () => {
  it("BLOQUEADO si modulo no completado", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_BE.id,
            estado: "EN_PROGRESO",
            porcentajeAvance: 30,
            completadoAt: null,
          },
        ],
      }),
    )
    const moduloBe = r.areas.flatMap((a) => a.modulos).find((m) => m.id === MODULO_BE.id)
    expect(moduloBe?.miniProyecto?.estado).toBe("BLOQUEADO")
    expect(moduloBe?.miniProyecto?.href).toBeNull()
  })

  it("DISPONIBLE si modulo completado y sin entrega", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_BE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
        ],
      }),
    )
    const moduloBe = r.areas.flatMap((a) => a.modulos).find((m) => m.id === MODULO_BE.id)
    expect(moduloBe?.miniProyecto?.estado).toBe("DISPONIBLE")
    expect(moduloBe?.miniProyecto?.href).toContain("#mini-proyecto")
  })

  it("APROBADO si entrega EVALUADA con nota >= umbral", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_BE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
        ],
        entregasMini: [
          {
            miniProyectoId: "mini-be",
            intento: 1,
            notaFinal: 85,
            estado: "EVALUADA",
            enviadaAt: new Date(),
          },
        ],
      }),
    )
    const moduloBe = r.areas.flatMap((a) => a.modulos).find((m) => m.id === MODULO_BE.id)
    expect(moduloBe?.miniProyecto?.estado).toBe("APROBADO")
    expect(moduloBe?.miniProyecto?.nota).toBe(85)
  })

  it("REPROBADO si nota < umbral", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_BE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
        ],
        entregasMini: [
          {
            miniProyectoId: "mini-be",
            intento: 1,
            notaFinal: 50,
            estado: "EVALUADA",
            enviadaAt: new Date(),
          },
        ],
      }),
    )
    const moduloBe = r.areas.flatMap((a) => a.modulos).find((m) => m.id === MODULO_BE.id)
    expect(moduloBe?.miniProyecto?.estado).toBe("REPROBADO")
  })
})

describe("hitos", () => {
  it("transversal=null si el curso no lo tiene", () => {
    const r = construirVistaCurso(fixture())
    expect(r.hitos.transversal).toBeNull()
    expect(r.hitos.entrevista).toBeNull()
  })

  it("transversal BLOQUEADO si areas OBLIG no cumplidas, con requisitos listados", () => {
    const r = construirVistaCurso(
      fixture({
        transversal: {
          id: "t1",
          titulo: "Proyecto Final",
          enunciado: "Crea un repo con la solucion completa.",
          umbralAprobacion: 70,
        },
      }),
    )
    expect(r.hitos.transversal?.estado).toBe("BLOQUEADO")
    expect(r.hitos.transversal?.requisitos.length).toBeGreaterThan(0)
    expect(r.hitos.transversal?.requisitos.every((req) => !req.cumplido)).toBe(true)
  })

  it("transversal DISPONIBLE si todas las areas estan cumplidas", () => {
    const r = construirVistaCurso(
      fixture({
        estadosModulo: [
          {
            moduloId: MODULO_FE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
          {
            moduloId: MODULO_BE.id,
            estado: "COMPLETADO",
            porcentajeAvance: 100,
            completadoAt: null,
          },
        ],
        // Mini de BE aprobado para que la nota del modulo cuente.
        entregasMini: [
          {
            miniProyectoId: "mini-be",
            intento: 1,
            notaFinal: 80,
            estado: "EVALUADA",
            enviadaAt: new Date(),
          },
        ],
        transversal: {
          id: "t1",
          titulo: "Proyecto Final",
          enunciado: "Crea repo",
          umbralAprobacion: 70,
        },
      }),
    )
    expect(r.hitos.transversal?.estado).toBe("DISPONIBLE")
    expect(r.hitos.transversal?.requisitos).toHaveLength(0)
  })

  it("entrevista BLOQUEADA con requisito 'aprobar transversal' cuando hay transversal", () => {
    const r = construirVistaCurso(
      fixture({
        transversal: {
          id: "t1",
          titulo: "Proyecto Final",
          enunciado: "Crea repo",
          umbralAprobacion: 70,
        },
        entrevistaConfig: { id: "e1", umbralAprobacion: 70, maxIntentos: 3 },
      }),
    )
    expect(r.hitos.entrevista?.estado).toBe("BLOQUEADO")
    expect(r.hitos.entrevista?.requisitos[0]?.texto).toContain("Transversal")
  })

  it("entrevista APROBADO refleja nota y limita intentos", () => {
    const r = construirVistaCurso(
      fixture({
        entrevistaConfig: { id: "e1", umbralAprobacion: 70, maxIntentos: 3 },
        sesionesEntrevista: [
          { intento: 1, estado: "APROBADA", scoreGeneral: 85, finalizadaAt: new Date() },
        ],
      }),
    )
    expect(r.hitos.entrevista?.estado).toBe("APROBADO")
    expect(r.hitos.entrevista?.nota).toBe(85)
    expect(r.hitos.entrevista?.intentosMax).toBe(3)
  })

  it("entrevista REPROBADO_SIN_INTENTOS si supera maxIntentos", () => {
    const r = construirVistaCurso(
      fixture({
        entrevistaConfig: { id: "e1", umbralAprobacion: 70, maxIntentos: 2 },
        sesionesEntrevista: [
          { intento: 1, estado: "NO_APROBADA", scoreGeneral: 40, finalizadaAt: new Date() },
          { intento: 2, estado: "NO_APROBADA", scoreGeneral: 50, finalizadaAt: new Date() },
        ],
      }),
    )
    expect(r.hitos.entrevista?.estado).toBe("REPROBADO_SIN_INTENTOS")
    expect(r.hitos.entrevista?.href).toBeNull()
  })
})
