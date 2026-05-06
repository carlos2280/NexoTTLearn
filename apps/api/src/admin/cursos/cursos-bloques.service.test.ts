import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import {
  type ActualizarBloqueAdminInput,
  type CrearBloqueAdminInput,
  type ReordenarBloquesAdminInput,
  crearBloqueAdminInputSchema,
} from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosBloquesService } from "./cursos-bloques.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  modulo: { findUnique: Stub }
  seccion: { findUnique: Stub }
  bloque: {
    findUnique: Stub
    findMany: Stub
    create: Stub
    update: Stub
    delete: Stub
    count: Stub
  }
  entregaBloque: { count: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: { findUnique: vi.fn() },
    modulo: { findUnique: vi.fn() },
    seccion: { findUnique: vi.fn() },
    bloque: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    entregaBloque: { count: vi.fn() },
    logActividad: { create: vi.fn() },
    $transaction: vi.fn((arg: unknown) => {
      if (typeof arg === "function") {
        const fn = arg as (tx: PrismaMock) => Promise<unknown>
        return fn(prisma)
      }
      return Promise.all(arg as Promise<unknown>[])
    }),
  }
  return prisma
}

function buildService(prisma: PrismaMock = buildPrisma()) {
  const service = new CursosBloquesService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const MODULO_ID = "00000000-0000-0000-0000-000000000003"
const SECCION_ID = "00000000-0000-0000-0000-000000000004"
const BLOQUE_ID = "00000000-0000-0000-0000-000000000005"

type TipoBloqueRow = "PARRAFO" | "TIP" | "VIDEO" | "RECURSO" | "CODIGO" | "QUIZ"

function buildBloqueRow(
  overrides: Partial<{
    id: string
    seccionId: string
    tipo: TipoBloqueRow
    orden: number
    archivadoAt: Date | null
    archivadoEstado: "ARCHIVADO" | null
    payload: unknown
    codigoUbicacion: "INLINE" | "SEPARADO" | null
    codigoInteractivo: "SOLO_VER" | "EDITABLE" | null
    codigoEvaluable: "NINGUNO" | "PREGUNTAS" | "TESTS" | null
    codigoLenguaje: "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT" | "REACT" | null
    solucionReferencia: string | null
  }> = {},
) {
  const now = new Date("2026-05-06T10:00:00Z")
  const tipo = overrides.tipo ?? "PARRAFO"
  return {
    id: overrides.id ?? BLOQUE_ID,
    seccionId: overrides.seccionId ?? SECCION_ID,
    tipo,
    orden: overrides.orden ?? 0,
    archivadoAt: overrides.archivadoAt ?? null,
    archivadoEstado: overrides.archivadoEstado ?? null,
    payload:
      overrides.payload ??
      (tipo === "PARRAFO"
        ? { contenidoTiptap: { type: "doc", content: [] } }
        : tipo === "TIP"
          ? { variante: "info", texto: "Hola" }
          : tipo === "VIDEO"
            ? { url: "https://example.com/v.mp4", proveedor: "Vimeo" }
            : tipo === "RECURSO"
              ? { url: "https://example.com/r.pdf", esDescarga: true }
              : tipo === "CODIGO"
                ? { archivos: [{ nombre: "main.py", contenido: "print(1)" }] }
                : {
                    preguntas: [
                      {
                        enunciado: "1?",
                        opciones: ["a", "b"],
                        correcta: 0,
                        tipo: "unica",
                      },
                    ],
                  }),
    codigoUbicacion: overrides.codigoUbicacion ?? null,
    codigoInteractivo: overrides.codigoInteractivo ?? null,
    codigoEvaluable: overrides.codigoEvaluable ?? null,
    codigoLenguaje: overrides.codigoLenguaje ?? null,
    solucionReferencia: overrides.solucionReferencia ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

function buildCurso(estado: "BORRADOR" | "ACTIVO" | "CERRADO" = "BORRADOR") {
  return { id: CURSO_ID, estado }
}

function buildModulo(archivadoAt: Date | null = null) {
  return { id: MODULO_ID, cursoId: CURSO_ID, archivadoAt }
}

function buildSeccion(archivadoAt: Date | null = null) {
  return { id: SECCION_ID, moduloId: MODULO_ID, archivadoAt }
}

// ─────────────────────────────────────────────────────────────────
// LISTAR
// ─────────────────────────────────────────────────────────────────

describe("listar", () => {
  it("devuelve lista vacia cuando no hay bloques", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findMany.mockResolvedValue([])

    const result = await service.listar(CURSO_ID, MODULO_ID, SECCION_ID)
    expect(result).toEqual([])
  })

  it("permite listar aunque la seccion este archivada (lectura tolerante)", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion(new Date()))
    prisma.bloque.findMany.mockResolvedValue([buildBloqueRow()])

    const result = await service.listar(CURSO_ID, MODULO_ID, SECCION_ID)
    expect(result).toHaveLength(1)
  })

  it("lanza 404 si la seccion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(null)

    await expect(service.listar(CURSO_ID, MODULO_ID, SECCION_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si el modulo esta archivado", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo(new Date()))

    await expect(service.listar(CURSO_ID, MODULO_ID, SECCION_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// OBTENER POR ID
// ─────────────────────────────────────────────────────────────────

describe("obtenerPorId", () => {
  it("devuelve el bloque si existe y pertenece a la seccion", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow())

    const result = await service.obtenerPorId(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID)
    expect(result.id).toBe(BLOQUE_ID)
  })

  it("lanza 404 si el bloque no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findUnique.mockResolvedValue(null)

    await expect(service.obtenerPorId(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("lanza 404 si el bloque pertenece a otra seccion", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ seccionId: "otra-seccion" }))

    await expect(service.obtenerPorId(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// CREAR · happy path por tipo + payload invalido por tipo
// ─────────────────────────────────────────────────────────────────

describe("crear", () => {
  function setupCrearOk(prisma: PrismaMock, bloqueRow: ReturnType<typeof buildBloqueRow>) {
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.count.mockResolvedValue(0)
    prisma.bloque.create.mockResolvedValue(bloqueRow)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.bloque.findUnique.mockResolvedValue(bloqueRow)
  }

  it("crea un bloque PARRAFO", async () => {
    const { service, prisma } = buildService()
    const row = buildBloqueRow({ tipo: "PARRAFO" })
    setupCrearOk(prisma, row)

    const input: CrearBloqueAdminInput = {
      tipo: "PARRAFO",
      payload: { contenidoTiptap: { type: "doc", content: [] } },
    }
    const result = await service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result.tipo).toBe("PARRAFO")
  })

  it("crea un bloque TIP", async () => {
    const { service, prisma } = buildService()
    const row = buildBloqueRow({ tipo: "TIP" })
    setupCrearOk(prisma, row)

    const input: CrearBloqueAdminInput = {
      tipo: "TIP",
      payload: { variante: "info", texto: "Atencion" },
    }
    const result = await service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result.tipo).toBe("TIP")
  })

  it("crea un bloque VIDEO", async () => {
    const { service, prisma } = buildService()
    const row = buildBloqueRow({ tipo: "VIDEO" })
    setupCrearOk(prisma, row)

    const input: CrearBloqueAdminInput = {
      tipo: "VIDEO",
      payload: { url: "https://example.com/x.mp4", proveedor: "Vimeo" },
    }
    const result = await service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result.tipo).toBe("VIDEO")
  })

  it("crea un bloque RECURSO", async () => {
    const { service, prisma } = buildService()
    const row = buildBloqueRow({ tipo: "RECURSO" })
    setupCrearOk(prisma, row)

    const input: CrearBloqueAdminInput = {
      tipo: "RECURSO",
      payload: { url: "https://example.com/r.pdf", esDescarga: true },
    }
    const result = await service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result.tipo).toBe("RECURSO")
  })

  it("crea un bloque CODIGO con campos especificos", async () => {
    const { service, prisma } = buildService()
    const row = buildBloqueRow({
      tipo: "CODIGO",
      codigoUbicacion: "INLINE",
      codigoInteractivo: "EDITABLE",
      codigoEvaluable: "NINGUNO",
      codigoLenguaje: "PYTHON",
    })
    setupCrearOk(prisma, row)

    const input: CrearBloqueAdminInput = {
      tipo: "CODIGO",
      payload: { archivos: [{ nombre: "main.py", contenido: "print(1)" }] },
      codigoUbicacion: "INLINE",
      codigoInteractivo: "EDITABLE",
      codigoEvaluable: "NINGUNO",
      codigoLenguaje: "PYTHON",
    }
    const result = await service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result.tipo).toBe("CODIGO")
    expect(prisma.bloque.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "CODIGO",
          codigoLenguaje: "PYTHON",
        }),
      }),
    )
  })

  it("crea un bloque QUIZ", async () => {
    const { service, prisma } = buildService()
    const row = buildBloqueRow({ tipo: "QUIZ" })
    setupCrearOk(prisma, row)

    const input: CrearBloqueAdminInput = {
      tipo: "QUIZ",
      payload: {
        preguntas: [
          {
            enunciado: "1+1?",
            opciones: ["1", "2"],
            correcta: 1,
            tipo: "unica",
          },
        ],
      },
    }
    const result = await service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result.tipo).toBe("QUIZ")
  })

  it("usa orden default = count de bloques activos", async () => {
    const { service, prisma } = buildService()
    const row = buildBloqueRow({ tipo: "PARRAFO", orden: 5 })
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.count.mockResolvedValue(5)
    prisma.bloque.create.mockResolvedValue(row)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.bloque.findUnique.mockResolvedValue(row)

    const input: CrearBloqueAdminInput = {
      tipo: "PARRAFO",
      payload: { contenidoTiptap: { type: "doc", content: [] } },
    }
    await service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(prisma.bloque.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orden: 5 }) }),
    )
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    const input: CrearBloqueAdminInput = {
      tipo: "PARRAFO",
      payload: { contenidoTiptap: { type: "doc", content: [] } },
    }
    await expect(service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si la seccion esta archivada", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion(new Date()))

    const input: CrearBloqueAdminInput = {
      tipo: "PARRAFO",
      payload: { contenidoTiptap: { type: "doc", content: [] } },
    }
    await expect(service.crear(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  // Payload invalido por tipo (Zod a nivel del schema). Validamos con safeParse
  // directo sobre el schema (es el mismo punto de fallo que el ZodValidationPipe
  // del controller, donde 400 se devuelve antes de tocar el service).
  it("rechaza payload invalido para PARRAFO", () => {
    const result = crearBloqueAdminInputSchema.safeParse({
      tipo: "PARRAFO",
      payload: { foo: "bar" },
    })
    expect(result.success).toBe(false)
  })

  it("rechaza payload invalido para TIP", () => {
    const result = crearBloqueAdminInputSchema.safeParse({
      tipo: "TIP",
      payload: { variante: "info" }, // falta texto
    })
    expect(result.success).toBe(false)
  })

  it("rechaza payload invalido para VIDEO", () => {
    const result = crearBloqueAdminInputSchema.safeParse({
      tipo: "VIDEO",
      payload: { url: "no-es-url", proveedor: "Vimeo" },
    })
    expect(result.success).toBe(false)
  })

  it("rechaza payload invalido para RECURSO", () => {
    const result = crearBloqueAdminInputSchema.safeParse({
      tipo: "RECURSO",
      payload: { url: "https://x.com/a", esDescarga: "no-es-bool" },
    })
    expect(result.success).toBe(false)
  })

  it("rechaza payload invalido para CODIGO (sin archivos)", () => {
    const result = crearBloqueAdminInputSchema.safeParse({
      tipo: "CODIGO",
      payload: { archivos: [] },
      codigoUbicacion: "INLINE",
      codigoInteractivo: "EDITABLE",
      codigoEvaluable: "NINGUNO",
      codigoLenguaje: "PYTHON",
    })
    expect(result.success).toBe(false)
  })

  it("rechaza payload invalido para QUIZ (sin preguntas)", () => {
    const result = crearBloqueAdminInputSchema.safeParse({
      tipo: "QUIZ",
      payload: { preguntas: [] },
    })
    expect(result.success).toBe(false)
  })

  it("rechaza CODIGO sin los campos especificos requeridos", () => {
    const result = crearBloqueAdminInputSchema.safeParse({
      tipo: "CODIGO",
      payload: { archivos: [{ nombre: "main.py", contenido: "print(1)" }] },
    })
    expect(result.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR
// ─────────────────────────────────────────────────────────────────

describe("actualizar", () => {
  it("actualiza payload correctamente revalidando con el tipo persistido", async () => {
    const { service, prisma } = buildService()
    const previo = buildBloqueRow({ tipo: "TIP" })
    prisma.bloque.findUnique.mockResolvedValueOnce(previo)
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    const actualizado = buildBloqueRow({
      tipo: "TIP",
      payload: { variante: "warning", texto: "Cuidado" },
    })
    prisma.bloque.update.mockResolvedValue(actualizado)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.bloque.findUnique.mockResolvedValueOnce(actualizado)

    const input: ActualizarBloqueAdminInput = {
      payload: { variante: "warning", texto: "Cuidado" },
    }
    const result = await service.actualizar(
      CURSO_ID,
      MODULO_ID,
      SECCION_ID,
      BLOQUE_ID,
      input,
      ACTOR_ID,
    )
    expect((result.payload as { texto: string }).texto).toBe("Cuidado")
  })

  it("rechaza payload que no encaja con el tipo persistido", async () => {
    const { service, prisma } = buildService()
    const previo = buildBloqueRow({ tipo: "TIP" })
    prisma.bloque.findUnique.mockResolvedValue(previo)
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    const input: ActualizarBloqueAdminInput = {
      payload: { url: "https://example.com/v.mp4", proveedor: "Vimeo" },
    }
    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, input, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })

  it("rechaza campos CODIGO_* en bloque no-CODIGO", async () => {
    const { service, prisma } = buildService()
    const previo = buildBloqueRow({ tipo: "PARRAFO" })
    prisma.bloque.findUnique.mockResolvedValue(previo)
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    const input: ActualizarBloqueAdminInput = {
      codigoLenguaje: "PYTHON",
    }
    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, input, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })

  it("rechaza intento de cambiar tipo (Zod schema strict bloquea)", async () => {
    const { actualizarBloqueAdminInputSchema } = await import("@nexott-learn/shared-types")
    const result = actualizarBloqueAdminInputSchema.safeParse({
      tipo: "VIDEO",
      payload: { url: "https://x.com", proveedor: "Vimeo" },
    })
    expect(result.success).toBe(false)
  })

  it("rechaza intento de enviar `orden` (PATCH no lo acepta)", async () => {
    const { actualizarBloqueAdminInputSchema } = await import("@nexott-learn/shared-types")
    const result = actualizarBloqueAdminInputSchema.safeParse({ orden: 3 })
    expect(result.success).toBe(false)
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, {}, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el bloque no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findUnique.mockResolvedValue(null)

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, {}, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si la seccion esta archivada", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    // requireBloque -> requireSeccionInclusoArchivada -> seccion archivada OK,
    // pero luego requireSeccion (no archivada) falla.
    prisma.seccion.findUnique
      .mockResolvedValueOnce(buildSeccion(new Date()))
      .mockResolvedValueOnce(buildSeccion(new Date()))
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, {}, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ARCHIVAR / DESARCHIVAR
// ─────────────────────────────────────────────────────────────────

describe("archivar", () => {
  it("archiva el bloque", async () => {
    const { service, prisma } = buildService()
    const previo = buildBloqueRow({ tipo: "PARRAFO" })
    prisma.bloque.findUnique.mockResolvedValueOnce(previo)
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    const archivado = buildBloqueRow({ tipo: "PARRAFO", archivadoAt: new Date() })
    prisma.bloque.update.mockResolvedValue(archivado)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.bloque.findUnique.mockResolvedValueOnce(archivado)

    const result = await service.archivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID)
    expect(result.archivadoAt).not.toBeNull()
  })

  it("es idempotente: bloque ya archivado no re-actualiza", async () => {
    const { service, prisma } = buildService()
    const archivado = buildBloqueRow({
      tipo: "PARRAFO",
      archivadoAt: new Date(),
      archivadoEstado: "ARCHIVADO",
    })
    prisma.bloque.findUnique.mockResolvedValue(archivado)
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    const result = await service.archivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID)
    expect(result.archivadoAt).not.toBeNull()
    expect(prisma.bloque.update).not.toHaveBeenCalled()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(
      service.archivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si la seccion esta archivada", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique
      .mockResolvedValueOnce(buildSeccion(new Date()))
      .mockResolvedValueOnce(buildSeccion(new Date()))
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    await expect(
      service.archivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })
})

describe("desarchivar", () => {
  it("desarchiva el bloque", async () => {
    const { service, prisma } = buildService()
    const archivado = buildBloqueRow({
      tipo: "PARRAFO",
      archivadoAt: new Date(),
      archivadoEstado: "ARCHIVADO",
    })
    prisma.bloque.findUnique.mockResolvedValueOnce(archivado)
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    const activo = buildBloqueRow({ tipo: "PARRAFO" })
    prisma.bloque.update.mockResolvedValue(activo)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.bloque.findUnique.mockResolvedValueOnce(activo)

    const result = await service.desarchivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID)
    expect(result.archivadoAt).toBeNull()
  })

  it("es idempotente: bloque activo no re-actualiza", async () => {
    const { service, prisma } = buildService()
    const activo = buildBloqueRow({ tipo: "PARRAFO" })
    prisma.bloque.findUnique.mockResolvedValue(activo)
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    const result = await service.desarchivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID)
    expect(result.archivadoAt).toBeNull()
    expect(prisma.bloque.update).not.toHaveBeenCalled()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.bloque.findUnique.mockResolvedValue(
      buildBloqueRow({ tipo: "PARRAFO", archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" }),
    )
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(
      service.desarchivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si la seccion esta archivada", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique
      .mockResolvedValueOnce(buildSeccion(new Date()))
      .mockResolvedValueOnce(buildSeccion(new Date()))
    prisma.bloque.findUnique.mockResolvedValue(
      buildBloqueRow({ tipo: "PARRAFO", archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" }),
    )
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    await expect(
      service.desarchivar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────────────────────────

describe("eliminar", () => {
  it("elimina el bloque en curso BORRADOR sin entregas", async () => {
    const { service, prisma } = buildService()
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.bloque.delete.mockResolvedValue({})

    const result = await service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID)
    expect(result.tipo).toBe("ELIMINADO")
    expect(result.id).toBe(BLOQUE_ID)
  })

  it("lanza 409 si el curso no es BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("ACTIVO"))

    await expect(
      service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si tiene entregas", async () => {
    const { service, prisma } = buildService()
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(1)

    await expect(
      service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el bloque no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findUnique.mockResolvedValue(null)

    await expect(
      service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si la seccion esta archivada", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique
      .mockResolvedValueOnce(buildSeccion(new Date()))
      .mockResolvedValueOnce(buildSeccion(new Date()))
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRow({ tipo: "PARRAFO" }))
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(0)

    await expect(
      service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, BLOQUE_ID, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// REORDENAR
// ─────────────────────────────────────────────────────────────────

describe("reordenar", () => {
  const bloqueId2 = "00000000-0000-0000-0000-000000000006"

  it("reordena bloques correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findMany
      .mockResolvedValueOnce([{ id: BLOQUE_ID }, { id: bloqueId2 }])
      .mockResolvedValueOnce([
        buildBloqueRow({ id: BLOQUE_ID, tipo: "PARRAFO", orden: 1 }),
        buildBloqueRow({ id: bloqueId2, tipo: "TIP", orden: 0 }),
      ])
    prisma.bloque.update.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})

    const input: ReordenarBloquesAdminInput = {
      items: [
        { id: BLOQUE_ID, orden: 1 },
        { id: bloqueId2, orden: 0 },
      ],
    }
    const result = await service.reordenar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result).toHaveLength(2)
    expect(prisma.bloque.update).toHaveBeenCalledTimes(2)
  })

  it("lanza 400 si subset incompleto", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findMany.mockResolvedValue([{ id: BLOQUE_ID }, { id: bloqueId2 }])

    const input: ReordenarBloquesAdminInput = { items: [{ id: BLOQUE_ID, orden: 0 }] }
    await expect(
      service.reordenar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })

  it("lanza 400 si id ajeno", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findMany.mockResolvedValue([{ id: BLOQUE_ID }])

    const input: ReordenarBloquesAdminInput = {
      items: [{ id: "00000000-0000-0000-0000-00000000ffff", orden: 0 }],
    }
    await expect(
      service.reordenar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })

  it("lanza 400 si orden duplicado", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findMany.mockResolvedValue([{ id: BLOQUE_ID }, { id: bloqueId2 }])

    const input: ReordenarBloquesAdminInput = {
      items: [
        { id: BLOQUE_ID, orden: 0 },
        { id: bloqueId2, orden: 0 },
      ],
    }
    await expect(
      service.reordenar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })

  it("lanza 400 si orden fuera de rango", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion())
    prisma.bloque.findMany.mockResolvedValue([{ id: BLOQUE_ID }, { id: bloqueId2 }])

    const input: ReordenarBloquesAdminInput = {
      items: [
        { id: BLOQUE_ID, orden: 0 },
        { id: bloqueId2, orden: 5 },
      ],
    }
    await expect(
      service.reordenar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    const input: ReordenarBloquesAdminInput = { items: [{ id: BLOQUE_ID, orden: 0 }] }
    await expect(
      service.reordenar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si la seccion esta archivada", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccion(new Date()))

    const input: ReordenarBloquesAdminInput = { items: [{ id: BLOQUE_ID, orden: 0 }] }
    await expect(
      service.reordenar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })
})
