// Auto-inscripcion del participante a un curso libre.
//
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/ficha-curso-libre.md §3
//
// Reglas (todas verificables sin DB en service tests si se mockea Prisma; aqui
// se valida sin mock por simplicidad):
//   - El curso debe existir + permiteInscripcionLibre + estado ACTIVO -> sino
//     404.
//   - Si el participante ya tiene Inscripcion ACTIVA en el curso -> 409 con
//     codigo YA_INSCRITO. El front interpreta y redirige a /cursos/{slug}.
//   - Si tiene una Inscripcion ABANDONADA o terminal -> se permite crear una
//     NUEVA Inscripcion ACTIVA (la anterior queda en historico).
//   - La nueva Inscripcion se crea con tipo=LIBRE, estado=ACTIVA,
//     inscritaAt=now. Sin asignaciones (catalogo libre, decision V-04 README).
//   - Idempotencia: si ocurre P2002 (Inscripcion_unica_activa) por race -> 409.

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type { CatalogoInscribirmeResponse } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"

@Injectable()
export class CatalogoInscribirService {
  constructor(private readonly prisma: PrismaService) {}

  async inscribirseEnCurso(
    participanteId: string,
    slug: string,
  ): Promise<CatalogoInscribirmeResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        titulo: true,
        estado: true,
        permiteInscripcionLibre: true,
      },
    })

    if (!curso || !curso.permiteInscripcionLibre || curso.estado !== "ACTIVO") {
      throw new NotFoundException(`Curso no disponible en el catalogo: ${slug}`)
    }

    const yaActiva = await this.prisma.inscripcion.findFirst({
      where: { participanteId, cursoId: curso.id, estado: "ACTIVA" },
      select: { id: true },
    })
    if (yaActiva) {
      throw new ConflictException({
        codigo: "YA_INSCRITO",
        mensaje: "Ya tienes una inscripcion activa en este curso",
        vistaCursoHref: `/cursos/${curso.slug}`,
      })
    }

    let inscripcion: { id: string }
    try {
      inscripcion = await this.prisma.inscripcion.create({
        data: {
          participanteId,
          cursoId: curso.id,
          tipo: "LIBRE",
          estado: "ACTIVA",
        },
        select: { id: true },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException({
          codigo: "YA_INSCRITO",
          mensaje: "Ya tienes una inscripcion activa en este curso",
          vistaCursoHref: `/cursos/${curso.slug}`,
        })
      }
      throw error
    }

    return {
      inscripcionId: inscripcion.id,
      cursoSlug: curso.slug,
      vistaCursoHref: `/cursos/${curso.slug}`,
      mensaje: `Inscrito en ${curso.titulo}`,
    }
  }
}
