import type {
  DiagnosticoData,
  EstadoInvitado,
  FilaMatrizDiagnostico,
  InscripcionDiagnostico,
  ParticipanteDiagnostico,
  SemaforoCelda,
  TarjetaAsignacion,
} from "../types/diagnostico"
import { AREAS_MOCK, MODULOS_MOCK } from "./areas-y-modulos"

interface PersonaMock {
  readonly nombre: string
  readonly apellido: string
  readonly email: string
  readonly notas: readonly (number | null)[]
  readonly estado: EstadoInvitado
  readonly asignada?: boolean
}

const PERSONAS: readonly PersonaMock[] = [
  {
    nombre: "Pedro",
    apellido: "Soto",
    email: "pedro@ntt.com",
    notas: [82, 88, 78, 75, 92, 90],
    estado: "con-login-con-eval",
    asignada: true,
  },
  {
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@ntt.com",
    notas: [85, 45, 50, 40, 80, 85],
    estado: "con-login-con-eval",
  },
  {
    nombre: "Ana",
    apellido: "Reyes",
    email: "ana@ntt.com",
    notas: [null, null, null, null, null, null],
    estado: "con-login-sin-eval",
  },
  {
    nombre: "María",
    apellido: "Reyes",
    email: "maria@ntt.com",
    notas: [30, 70, 80, 70, 85, 90],
    estado: "con-login-con-eval",
    asignada: true,
  },
  {
    nombre: "Luis",
    apellido: "Vega",
    email: "luis@ntt.com",
    notas: [null, null, null, null, null, null],
    estado: "sin-login",
  },
  {
    nombre: "Carla",
    apellido: "Mora",
    email: "carla@ntt.com",
    notas: [78, 82, 65, 55, 88, 92],
    estado: "con-login-con-eval",
  },
  {
    nombre: "Diego",
    apellido: "Lara",
    email: "diego@ntt.com",
    notas: [90, 75, 70, null, 85, null],
    estado: "con-login-sin-eval",
  },
  {
    nombre: "Sofía",
    apellido: "Núñez",
    email: "sofia@ntt.com",
    notas: [60, 65, 72, 68, 80, 88],
    estado: "con-login-con-eval",
  },
]

function semaforoDe(nota: number | null, objetivo: number): SemaforoCelda {
  if (nota === null) {
    return "vacio"
  }
  if (nota >= objetivo) {
    return "verde"
  }
  if (nota >= objetivo - 10) {
    return "amarillo"
  }
  return "rojo"
}

function buildParticipante(p: PersonaMock, idx: number): ParticipanteDiagnostico {
  return {
    id: `u-${idx + 1}`,
    nombre: p.nombre,
    apellido: p.apellido,
    email: p.email,
    ultimoLoginAt: p.estado === "sin-login" ? undefined : "2026-05-01T10:00:00Z",
  }
}

function buildInscripcion(p: PersonaMock, idx: number): InscripcionDiagnostico {
  const conDato = p.notas.filter((n) => n !== null).length
  return {
    inscripcionId: `i-${idx + 1}`,
    participante: buildParticipante(p, idx),
    estadoInvitado: p.estado,
    invitadaAt: "2026-05-04T09:00:00Z",
    evaluacion: {
      areasConDato: conDato,
      areasTotales: AREAS_MOCK.length,
      completa: conDato === AREAS_MOCK.length,
    },
    asignacion: { confirmada: p.asignada === true, modulosCount: p.asignada === true ? 2 : 0 },
  }
}

function buildFilaMatriz(p: PersonaMock, idx: number): FilaMatrizDiagnostico {
  const celdas = AREAS_MOCK.map((area, ai) => {
    const nota = p.notas[ai] ?? null
    const semaforo = semaforoDe(nota, area.puntajeObjetivo)
    return nota === null
      ? { areaId: area.id, semaforo: "vacio" as const }
      : { areaId: area.id, nota, semaforo }
  })
  const capturadas = celdas.filter((c) => c.semaforo !== "vacio").length
  return {
    inscripcionId: `i-${idx + 1}`,
    participante: buildParticipante(p, idx),
    celdas,
    cobertura: { capturadas, total: AREAS_MOCK.length },
  }
}

function buildTarjeta(p: PersonaMock, idx: number): TarjetaAsignacion {
  const tieneEvaluacion = p.notas.every((n) => n !== null)
  const sugerencias = AREAS_MOCK.flatMap((area, ai) => {
    const nota = p.notas[ai] ?? null
    const modulos = MODULOS_MOCK.filter((m) => m.areaId === area.id)
    if (nota === null || nota >= area.puntajeObjetivo) {
      return []
    }
    const motivo = nota >= area.puntajeObjetivo - 10 ? "CERCA" : "NO_CUMPLE"
    const tipo = motivo === "NO_CUMPLE" ? "OBLIGATORIO" : "RECOMENDADO"
    return modulos.map(
      (m) => ({ moduloId: m.id, moduloTitulo: m.titulo, areaId: area.id, tipo, motivo }) as const,
    )
  })
  const cumple = AREAS_MOCK.filter((area, ai) => {
    const nota = p.notas[ai] ?? null
    return nota !== null && nota >= area.puntajeObjetivo
  }).map((area) => ({ areaId: area.id, areaNombre: area.nombre }))
  return {
    inscripcionId: `i-${idx + 1}`,
    participante: buildParticipante(p, idx),
    tieneEvaluacion,
    sugerencias,
    confirmadas: [],
    cumple,
  }
}

export function getDiagnosticoMock(cursoId: string): DiagnosticoData {
  return {
    curso: {
      cursoId,
      empresaCliente: "Empresa XYZ",
      titulo: "Fullstack Developer",
      estado: "ACTIVO",
      deadline: "2026-05-14",
      diasRestantes: 7,
      areas: AREAS_MOCK,
    },
    inscripciones: PERSONAS.map(buildInscripcion),
    matriz: PERSONAS.map(buildFilaMatriz),
    asignaciones: PERSONAS.map(buildTarjeta),
  }
}
