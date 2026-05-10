import type { AreaDiagnostico } from "../types/diagnostico"

export const AREAS_MOCK: readonly AreaDiagnostico[] = [
  { id: "a-fe", nombre: "Frontend", color: "#7c3aed", puntajeObjetivo: 70 },
  { id: "a-be", nombre: "Backend", color: "#22d3ee", puntajeObjetivo: 70 },
  { id: "a-bd", nombre: "Bases de datos", color: "#10b981", puntajeObjetivo: 70 },
  { id: "a-cl", nombre: "Cloud", color: "#f59e0b", puntajeObjetivo: 60 },
  { id: "a-he", nombre: "Herramientas", color: "#f43f5e", puntajeObjetivo: 80 },
  { id: "a-ss", nombre: "Soft skills", color: "#38bdf8", puntajeObjetivo: 80 },
]

export interface ModuloMock {
  readonly id: string
  readonly titulo: string
  readonly areaId: string
}

export const MODULOS_MOCK: readonly ModuloMock[] = [
  { id: "m-fe-1", titulo: "Frontend HTML+React+Next", areaId: "a-fe" },
  { id: "m-be-1", titulo: "Backend Python+APIs", areaId: "a-be" },
  { id: "m-bd-1", titulo: "NoSQL básico", areaId: "a-bd" },
  { id: "m-bd-2", titulo: "PySpark+Pandas", areaId: "a-bd" },
  { id: "m-cl-1", titulo: "Azure Databricks", areaId: "a-cl" },
  { id: "m-he-1", titulo: "Git avanzado", areaId: "a-he" },
  { id: "m-ss-1", titulo: "Comunicación técnica", areaId: "a-ss" },
]
