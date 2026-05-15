import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  CursoArbolModulo,
  CursoArbolResponse,
  CursoArbolSeccion,
  ModoCursoParticipante,
} from "@nexott-learn/shared-types"
import { EstadoCurso, Prisma, RolAsignacion } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"

const TOP_SKILLS_DESTACADAS = 4

/**
 * `MeCursoArbolService` — `GET /me/cursos/:cursoId/arbol`.
 *
 * Devuelve el arbol del curso (modulos + secciones, sin bloques) que el
 * participante necesita para navegar el curso inmersivo en cualquiera de los
 * tres modos:
 *
 *   - `asignado`   — rol ASIGNADO. Pasa al frontend para componer con el plan
 *                    personal (el sidebar mostrara priorizacion del plan, no
 *                    el orden natural de catalogo).
 *   - `voluntario` — rol VOLUNTARIO (D-AS-1: sin plan). El frontend pinta el
 *                    arbol completo como TOC, sin recomendaciones.
 *   - `preview`    — sin asignacion + curso ACTIVO con `toggleVoluntarios=true`.
 *                    El frontend pinta el arbol en lectura + CTA "Inscribirme".
 *
 * Reglas de visibilidad consolidadas:
 *  - Si el usuario tiene asignacion al curso → 200 (modo `asignado` o
 *    `voluntario` segun `rol`).
 *  - Si no tiene asignacion pero el curso es ACTIVO con `toggleVoluntarios=
 *    true` → 200 con `modo: "preview"`.
 *  - Cualquier otro caso (curso BORRADOR/CERRADO/ARCHIVADO sin asignacion, o
 *    `toggleVoluntarios=false`) → 404 generico (no revelamos existencia, D-AS-9).
 */
@Injectable()
export class MeCursoArbolService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerArbol(usuarioId: string, cursoId: string): Promise<CursoArbolResponse> {
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

    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        titulo: true,
        estado: true,
        toggleVoluntarios: true,
        fechaInicio: true,
        fechaDeadline: true,
        cliente: { select: { id: true, nombre: true } },
        areasExigidas: {
          select: {
            peso: true,
            area: { select: { id: true, nombre: true, codigo: true } },
          },
        },
        skillsExigidas: {
          select: {
            notaMinima: true,
            skill: {
              select: {
                id: true,
                etiquetaVisible: true,
                area: { select: { codigo: true } },
              },
            },
          },
        },
        modulosHabilitados: {
          select: {
            modulo: {
              select: {
                id: true,
                titulo: true,
                secciones: {
                  select: {
                    id: true,
                    titulo: true,
                    orden: true,
                    _count: { select: { bloques: true } },
                  },
                  orderBy: { orden: "asc" },
                },
              },
            },
          },
        },
      },
    })

    if (!curso) {
      throw cursoNoEncontrado()
    }

    const asignacion = await this.prisma.asignacionCurso.findFirst({
      where: { cursoId, colaboradorId: usuario.colaboradorId },
      select: { id: true, rol: true },
    })

    const modo = this.resolverModo(curso, asignacion)
    if (modo === null) {
      throw cursoNoEncontrado()
    }

    const modulos = this.proyectarModulos(curso.modulosHabilitados)
    const areaPrincipal = this.calcularAreaPrincipal(curso.areasExigidas)
    const skillsDestacadas = this.calcularSkillsDestacadas(curso.skillsExigidas)

    return {
      modo,
      asignacionId: asignacion?.id ?? null,
      curso: {
        id: curso.id,
        titulo: curso.titulo,
        estado: curso.estado,
        fechaInicio: curso.fechaInicio.toISOString().slice(0, 10),
        fechaDeadline: curso.fechaDeadline.toISOString().slice(0, 10),
        cliente: { id: curso.cliente.id, nombre: curso.cliente.nombre },
        areaPrincipal,
        skillsDestacadas,
      },
      modulos,
    }
  }

  private resolverModo(
    curso: { estado: EstadoCurso; toggleVoluntarios: boolean },
    asignacion: { rol: RolAsignacion } | null,
  ): ModoCursoParticipante | null {
    if (asignacion) {
      return asignacion.rol === RolAsignacion.ASIGNADO ? "asignado" : "voluntario"
    }
    if (curso.estado === EstadoCurso.ACTIVO && curso.toggleVoluntarios) {
      return "preview"
    }
    return null
  }

  private proyectarModulos(
    rows: ReadonlyArray<{
      readonly modulo: {
        readonly id: string
        readonly titulo: string
        readonly secciones: ReadonlyArray<{
          readonly id: string
          readonly titulo: string
          readonly orden: number
          readonly _count: { readonly bloques: number }
        }>
      }
    }>,
  ): readonly CursoArbolModulo[] {
    return [...rows]
      .sort((a, b) => a.modulo.titulo.localeCompare(b.modulo.titulo))
      .map((row, indice) => {
        const secciones: readonly CursoArbolSeccion[] = row.modulo.secciones.map((s) => ({
          seccionId: s.id,
          titulo: s.titulo,
          orden: s.orden,
          totalBloques: s._count.bloques,
        }))
        return {
          moduloId: row.modulo.id,
          titulo: row.modulo.titulo,
          orden: indice,
          secciones,
        }
      })
  }

  private calcularAreaPrincipal(
    areasExigidas: ReadonlyArray<{
      readonly peso: Prisma.Decimal
      readonly area: { readonly id: string; readonly nombre: string; readonly codigo: string }
    }>,
  ): CursoArbolResponse["curso"]["areaPrincipal"] {
    if (areasExigidas.length === 0) {
      return null
    }
    const ordenadas = [...areasExigidas].sort((a, b) => {
      const diff = Number(b.peso) - Number(a.peso)
      if (diff !== 0) {
        return diff
      }
      return a.area.nombre.localeCompare(b.area.nombre)
    })
    const principal = ordenadas[0]
    if (!principal) {
      return null
    }
    return {
      id: principal.area.id,
      nombre: principal.area.nombre,
      codigo: principal.area.codigo,
    }
  }

  private calcularSkillsDestacadas(
    skillsExigidas: ReadonlyArray<{
      readonly notaMinima: Prisma.Decimal
      readonly skill: {
        readonly id: string
        readonly etiquetaVisible: string
        readonly area: { readonly codigo: string }
      }
    }>,
  ): CursoArbolResponse["curso"]["skillsDestacadas"] {
    return [...skillsExigidas]
      .sort((a, b) => {
        const diff = Number(b.notaMinima) - Number(a.notaMinima)
        if (diff !== 0) {
          return diff
        }
        return a.skill.etiquetaVisible.localeCompare(b.skill.etiquetaVisible)
      })
      .slice(0, TOP_SKILLS_DESTACADAS)
      .map(({ skill }) => ({
        id: skill.id,
        etiquetaVisible: skill.etiquetaVisible,
        areaCodigo: skill.area.codigo,
      }))
  }
}

function cursoNoEncontrado(): NotFoundException {
  // D-AS-9: respuesta generica para no revelar existencia de cursos a los que
  // el participante no tiene acceso (catalogo cerrado, curso BORRADOR, etc.).
  return new NotFoundException({
    code: apiErrorCodes.cursoNoEncontrado,
    message: "Curso no encontrado.",
  })
}
