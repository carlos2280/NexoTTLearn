/**
 * Tipos response de reportes estrategicos (Slice 11 P11c).
 *
 * Todos los endpoints estrategicos comparten un `meta` con:
 *   - `frescura`: ISO timestamp del momento en que se genero el payload
 *     (sea cache hit o recalculo).
 *   - `scopeHash`: SHA256 hex del scope normalizado (sirve al cliente para
 *     identificar cache batch y al backend para auditar).
 *   - `warning?`: motivo de degeneracion del response (ej. division por cero
 *     en `eficacia-plataforma` cuando `presentadosCliente=0`).
 */
export interface MetaEstrategico {
  readonly frescura: string
  readonly scopeHash: string
  readonly warning?: string
}

// ---------------------------------------------------------------------------
// E1 — GET /reportes/eficacia-plataforma
// ---------------------------------------------------------------------------

export interface EficaciaPlataformaAptos {
  readonly total: number
  readonly pasaron: number
  readonly noPasaron: number
  readonly pendientes: number
}

export interface EficaciaPlataformaNoAptos {
  readonly total: number
  readonly presentadosIgual: number
  readonly pasaronIgual: number
}

export interface ObservacionFrecuente {
  readonly texto: string
  readonly casos: number
}

export interface EficaciaPlataformaResponse {
  readonly presentadosCliente: number
  readonly aptos: EficaciaPlataformaAptos
  readonly noAptos: EficaciaPlataformaNoAptos
  readonly correlacion: number | null
  readonly observacionesFrecuentes: readonly ObservacionFrecuente[]
  readonly meta: MetaEstrategico
}

// ---------------------------------------------------------------------------
// E2 — GET /reportes/historico-cliente
// ---------------------------------------------------------------------------

export interface HistoricoClienteCursoItem {
  readonly cursoId: string
  readonly titulo: string
  readonly presentados: number
  readonly aceptados: number
  readonly porcentajeAceptacion: number
}

export interface HistoricoClienteResponse {
  readonly clienteId: string
  readonly periodo: {
    readonly desde: string | null
    readonly hasta: string | null
  }
  readonly cursos: readonly HistoricoClienteCursoItem[]
  readonly observacionesFrecuentes: readonly ObservacionFrecuente[]
  readonly meta: MetaEstrategico
}

// ---------------------------------------------------------------------------
// E3 — GET /reportes/inventario-skills
// ---------------------------------------------------------------------------

export interface InventarioSkillsConteoCualitativo {
  readonly excelencia: number
  readonly solido: number
  readonly enDesarrollo: number
  readonly noCumple: number
}

export interface InventarioSkillItem {
  readonly skillId: string
  readonly etiqueta: string
  readonly areaId: string
  readonly totalColaboradores: number
  readonly porEtiquetaCualitativa: InventarioSkillsConteoCualitativo
}

export interface InventarioSkillsResponse {
  readonly skills: readonly InventarioSkillItem[]
  readonly meta: MetaEstrategico
}

// ---------------------------------------------------------------------------
// E4 — GET /reportes/reutilizacion-catalogo
// ---------------------------------------------------------------------------

export interface ReutilizacionCatalogoModuloItem {
  readonly moduloId: string
  readonly titulo: string
  readonly vecesUsado: number
  readonly cursosUnicos: number
}

export interface ReutilizacionCatalogoSkillItem {
  readonly skillId: string
  readonly etiqueta: string
  readonly vecesExigida: number
  readonly cursosUnicos: number
}

export interface ReutilizacionCatalogoResponse {
  readonly modulos: readonly ReutilizacionCatalogoModuloItem[]
  readonly skills: readonly ReutilizacionCatalogoSkillItem[]
  readonly meta: MetaEstrategico
}
