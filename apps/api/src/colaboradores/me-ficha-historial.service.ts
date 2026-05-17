import { Injectable, NotFoundException } from "@nestjs/common"
import type { EventoHistorialFicha, NivelCualitativoArea } from "@nexott-learn/shared-types"
import { EstadoAsignado, EstadoVoluntario, OrigenNotaSkill, RolAsignacion } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"

const UMBRAL_EXCELENCIA = 85
const UMBRAL_SOLIDO = 70
const UMBRAL_DESARROLLO = 50

/**
 * `MeFichaHistorialService` — B-24. UNION cronologico de hitos del colaborador
 * para la seccion "Tu historial" de `/mi-ficha`:
 *
 *  - `SKILL_DEMOSTRADA` desde `HistoricoNotaSkill` (entradas con `valor` no
 *    nulo; las marcas "sin evidencia" no son hitos visibles).
 *  - `CURSO_INICIADO` desde `AsignacionCurso.createdAt`.
 *  - `CURSO_COMPLETADO` desde `AsignacionCurso.fechaCierre` cuando el estado
 *    es APTO/NO_APTO (asignado) o COMPLETADO (voluntario).
 *
 * Devuelve la union ordenada por fecha DESC, cortada al `limite` solicitado.
 * El frontend (`tu-historial.tsx`) pagina en memoria con un boton "Ver mas".
 * El parametro `cursor` esta en el contrato pero todavia no se interpreta —
 * cuando el volumen crezca se evolucionara a cursor real `(fecha, id)`.
 */
@Injectable()
export class MeFichaHistorialService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerHistorialDeUsuario(
    usuarioId: string,
    limite: number,
  ): Promise<readonly EventoHistorialFicha[]> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuario?.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
    return this.obtenerHistorial(usuario.colaboradorId, limite)
  }

  async obtenerHistorial(
    colaboradorId: string,
    limite: number,
  ): Promise<readonly EventoHistorialFicha[]> {
    const [historicoSkills, asignaciones] = await Promise.all([
      this.cargarHistoricoSkills(colaboradorId, limite),
      this.cargarAsignaciones(colaboradorId, limite),
    ])

    const cursoPorHistorico = await this.cargarCursosPorHistorico(historicoSkills)

    const eventos: EventoHistorialFicha[] = [
      ...historicoSkills.map((row) =>
        toEventoSkillDemostrada(row, cursoPorHistorico.get(row.id) ?? null),
      ),
      ...asignaciones.flatMap(toEventosCurso),
    ]

    return eventos.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, limite)
  }

  /**
   * Resuelve el titulo del curso de cada `HistoricoNotaSkill` cuyo origen
   * apunta a un intento concreto. Tres queries batched (una por tipo de
   * intento) — sin N+1 — para enriquecer `origenNarrativo` (DEUDA-B24-1).
   * Para `ENTREVISTA_INICIAL` y `MANUAL` no aplica (no hay curso asociado).
   */
  private async cargarCursosPorHistorico(
    rows: readonly HistoricoSkillRow[],
  ): Promise<ReadonlyMap<string, string>> {
    const { refByHistorico, bloqueIds, transversalIds, entrevistaIaIds } =
      recolectarReferencias(rows)
    const tituloPorIntento = await this.cargarTitulosPorIntento({
      bloqueIds,
      transversalIds,
      entrevistaIaIds,
    })
    const result = new Map<string, string>()
    for (const [historicoId, ref] of refByHistorico) {
      const titulo = tituloPorIntento.get(ref.intentoId)
      if (titulo) {
        result.set(historicoId, titulo)
      }
    }
    return result
  }

  private async cargarTitulosPorIntento(input: {
    readonly bloqueIds: ReadonlySet<string>
    readonly transversalIds: ReadonlySet<string>
    readonly entrevistaIaIds: ReadonlySet<string>
  }): Promise<ReadonlyMap<string, string>> {
    const [bloques, transversales, entrevistas] = await Promise.all([
      input.bloqueIds.size === 0
        ? Promise.resolve([] as readonly IntentoBloqueLookup[])
        : this.prisma.intentoBloque.findMany({
            where: { id: { in: [...input.bloqueIds] } },
            select: { id: true, curso: { select: { titulo: true } } },
          }),
      input.transversalIds.size === 0
        ? Promise.resolve([] as readonly IntentoTransversalLookup[])
        : this.prisma.intentoTransversal.findMany({
            where: { id: { in: [...input.transversalIds] } },
            select: {
              id: true,
              transversal: { select: { curso: { select: { titulo: true } } } },
            },
          }),
      input.entrevistaIaIds.size === 0
        ? Promise.resolve([] as readonly IntentoEntrevistaIaLookup[])
        : this.prisma.intentoEntrevistaIA.findMany({
            where: { id: { in: [...input.entrevistaIaIds] } },
            select: {
              id: true,
              entrevistaIA: { select: { curso: { select: { titulo: true } } } },
            },
          }),
    ])
    const tituloPorIntento = new Map<string, string>()
    for (const b of bloques) {
      if (b.curso?.titulo) {
        tituloPorIntento.set(b.id, b.curso.titulo)
      }
    }
    for (const t of transversales) {
      const titulo = t.transversal?.curso?.titulo
      if (titulo) {
        tituloPorIntento.set(t.id, titulo)
      }
    }
    for (const e of entrevistas) {
      const titulo = e.entrevistaIA?.curso?.titulo
      if (titulo) {
        tituloPorIntento.set(e.id, titulo)
      }
    }
    return tituloPorIntento
  }

  private cargarHistoricoSkills(
    colaboradorId: string,
    limite: number,
  ): Promise<readonly HistoricoSkillRow[]> {
    return this.prisma.historicoNotaSkill.findMany({
      where: {
        valor: { not: null },
        notaSkill: { colaboradorId },
      },
      select: {
        id: true,
        fecha: true,
        valor: true,
        origen: true,
        referencia: true,
        notaSkill: {
          select: {
            skill: {
              select: {
                id: true,
                etiquetaVisible: true,
                area: { select: { id: true, nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { fecha: "desc" },
      take: limite,
    })
  }

  private cargarAsignaciones(
    colaboradorId: string,
    limite: number,
  ): Promise<readonly AsignacionRow[]> {
    return this.prisma.asignacionCurso.findMany({
      where: { colaboradorId },
      select: {
        id: true,
        rol: true,
        estadoAsignado: true,
        estadoVoluntario: true,
        createdAt: true,
        fechaCierre: true,
        curso: { select: { id: true, titulo: true } },
      },
      orderBy: { createdAt: "desc" },
      // Cada asignacion puede generar hasta 2 eventos (iniciado + completado),
      // por eso tomamos `limite` y no `limite/2`. Luego el sort + slice corta.
      take: limite,
    })
  }
}

interface HistoricoSkillRow {
  readonly id: string
  readonly fecha: Date
  readonly valor: { toString(): string } | null
  readonly origen: OrigenNotaSkill
  readonly referencia: unknown
  readonly notaSkill: {
    readonly skill: {
      readonly id: string
      readonly etiquetaVisible: string
      readonly area: { readonly id: string; readonly nombre: string }
    }
  }
}

interface AsignacionRow {
  readonly id: string
  readonly rol: RolAsignacion
  readonly estadoAsignado: EstadoAsignado | null
  readonly estadoVoluntario: EstadoVoluntario | null
  readonly createdAt: Date
  readonly fechaCierre: Date | null
  readonly curso: { readonly id: string; readonly titulo: string }
}

function toEventoSkillDemostrada(
  row: HistoricoSkillRow,
  cursoTitulo: string | null,
): EventoHistorialFicha {
  const valor = row.valor === null ? null : Number(row.valor.toString())
  return {
    tipo: "SKILL_DEMOSTRADA",
    id: row.id,
    fecha: row.fecha.toISOString(),
    skillId: row.notaSkill.skill.id,
    skillNombre: row.notaSkill.skill.etiquetaVisible,
    areaId: row.notaSkill.skill.area.id,
    areaNombre: row.notaSkill.skill.area.nombre,
    nivelCualitativo: nivelDesdeNota(valor),
    origenNarrativo: narrarOrigen(row.origen, cursoTitulo),
    origen: row.origen,
    ...(extraerIntentoIaId(row.origen, row.referencia) !== null
      ? { referenciaIntentoIaId: extraerIntentoIaId(row.origen, row.referencia) ?? undefined }
      : {}),
  }
}

function toEventosCurso(asig: AsignacionRow): readonly EventoHistorialFicha[] {
  const eventos: EventoHistorialFicha[] = [
    {
      tipo: "CURSO_INICIADO",
      id: `curso-iniciado-${asig.id}`,
      fecha: asig.createdAt.toISOString(),
      cursoId: asig.curso.id,
      cursoTitulo: asig.curso.titulo,
    },
  ]
  if (asig.fechaCierre !== null && esCompletadoVisible(asig)) {
    eventos.push({
      tipo: "CURSO_COMPLETADO",
      id: `curso-completado-${asig.id}`,
      fecha: asig.fechaCierre.toISOString(),
      cursoId: asig.curso.id,
      cursoTitulo: asig.curso.titulo,
    })
  }
  return eventos
}

function esCompletadoVisible(asig: AsignacionRow): boolean {
  if (asig.rol === RolAsignacion.ASIGNADO) {
    return (
      asig.estadoAsignado === EstadoAsignado.APTO || asig.estadoAsignado === EstadoAsignado.NO_APTO
    )
  }
  return asig.estadoVoluntario === EstadoVoluntario.COMPLETADO
}

function nivelDesdeNota(nota: number | null): NivelCualitativoArea {
  if (nota === null) {
    return "sinTocar"
  }
  if (nota >= UMBRAL_EXCELENCIA) {
    return "excelencia"
  }
  if (nota >= UMBRAL_SOLIDO) {
    return "solido"
  }
  if (nota >= UMBRAL_DESARROLLO) {
    return "enDesarrollo"
  }
  return "inicial"
}

/**
 * Narrativa humanizada del origen de la skill. Cuando hay `cursoTitulo`
 * resuelto (DEUDA-B24-1) lo incorpora — `Curso "Java Senior"` da contexto
 * al colaborador sobre QUE curso le valio la skill, no solo desde donde.
 * Para origenes sin curso asociado (ENTREVISTA_INICIAL, MANUAL) o cuando
 * el lookup no encontro titulo, cae a la version generica.
 */
function narrarOrigen(origen: OrigenNotaSkill, cursoTitulo: string | null): string {
  switch (origen) {
    case OrigenNotaSkill.ENTREVISTA_INICIAL:
      return "Entrevista inicial"
    case OrigenNotaSkill.BLOQUE:
      return cursoTitulo ? `Curso "${cursoTitulo}"` : "Bloque evaluable"
    case OrigenNotaSkill.TRANSVERSAL:
      return cursoTitulo ? `Proyecto transversal · Curso "${cursoTitulo}"` : "Proyecto transversal"
    case OrigenNotaSkill.ENTREVISTA_IA:
      return cursoTitulo ? `Entrevista IA · Curso "${cursoTitulo}"` : "Entrevista IA"
    case OrigenNotaSkill.MANUAL:
      return "Ajuste del administrador"
    default:
      return "Actualizacion"
  }
}

function extraerIntentoIaId(origen: OrigenNotaSkill, referencia: unknown): string | null {
  if (origen !== OrigenNotaSkill.ENTREVISTA_IA) {
    return null
  }
  if (referencia === null || typeof referencia !== "object" || Array.isArray(referencia)) {
    return null
  }
  const valor = (referencia as Record<string, unknown>).intentoEntrevistaIaId
  return typeof valor === "string" ? valor : null
}

interface IntentoRef {
  readonly tipo: "BLOQUE" | "TRANSVERSAL" | "ENTREVISTA_IA"
  readonly intentoId: string
}

function recolectarReferencias(rows: readonly HistoricoSkillRow[]): {
  readonly refByHistorico: ReadonlyMap<string, IntentoRef>
  readonly bloqueIds: ReadonlySet<string>
  readonly transversalIds: ReadonlySet<string>
  readonly entrevistaIaIds: ReadonlySet<string>
} {
  const refByHistorico = new Map<string, IntentoRef>()
  const bloqueIds = new Set<string>()
  const transversalIds = new Set<string>()
  const entrevistaIaIds = new Set<string>()
  for (const row of rows) {
    const ref = parseReferencia(row.origen, row.referencia)
    if (!ref) {
      continue
    }
    refByHistorico.set(row.id, ref)
    if (ref.tipo === "BLOQUE") {
      bloqueIds.add(ref.intentoId)
    } else if (ref.tipo === "TRANSVERSAL") {
      transversalIds.add(ref.intentoId)
    } else {
      entrevistaIaIds.add(ref.intentoId)
    }
  }
  return { refByHistorico, bloqueIds, transversalIds, entrevistaIaIds }
}

interface IntentoBloqueLookup {
  readonly id: string
  readonly curso: { readonly titulo: string } | null
}

interface IntentoTransversalLookup {
  readonly id: string
  readonly transversal: { readonly curso: { readonly titulo: string } | null } | null
}

interface IntentoEntrevistaIaLookup {
  readonly id: string
  readonly entrevistaIA: { readonly curso: { readonly titulo: string } | null } | null
}

/**
 * Extrae el id del intento referenciado segun el origen. Devuelve `null`
 * para `MANUAL` / `ENTREVISTA_INICIAL` (sin intento asociado) o cuando
 * `referencia` esta vacia/malformada.
 */
function parseReferencia(origen: OrigenNotaSkill, referencia: unknown): IntentoRef | null {
  if (referencia === null || typeof referencia !== "object" || Array.isArray(referencia)) {
    return null
  }
  const obj = referencia as Record<string, unknown>
  if (origen === OrigenNotaSkill.BLOQUE) {
    const id = obj.intentoBloqueId
    return typeof id === "string" ? { tipo: "BLOQUE", intentoId: id } : null
  }
  if (origen === OrigenNotaSkill.TRANSVERSAL) {
    const id = obj.intentoTransversalId
    return typeof id === "string" ? { tipo: "TRANSVERSAL", intentoId: id } : null
  }
  if (origen === OrigenNotaSkill.ENTREVISTA_IA) {
    const id = obj.intentoEntrevistaIaId
    return typeof id === "string" ? { tipo: "ENTREVISTA_IA", intentoId: id } : null
  }
  return null
}
