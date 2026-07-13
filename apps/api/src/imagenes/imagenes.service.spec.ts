import { BadRequestException, NotFoundException } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { ArchivoTipo } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StorageService } from "../common/storage/storage.service"
import { ImagenesService } from "./imagenes.service"

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
const USUARIO_ID = "00000000-0000-4000-8000-000000000001"
const ARCHIVO_ID = "00000000-0000-4000-8000-0000000000aa"

let storage: { guardar: ReturnType<typeof vi.fn>; leer: ReturnType<typeof vi.fn> }
let service: ImagenesService

beforeEach(() => {
  storage = { guardar: vi.fn(), leer: vi.fn() }
  const config = { getOrThrow: vi.fn().mockReturnValue("https://api.nexott.test") }
  service = new ImagenesService(
    storage as unknown as StorageService,
    config as unknown as ConfigService,
  )
})

describe("ImagenesService.subir", () => {
  it("guarda con el MIME real detectado por bytes y devuelve la URL absoluta", async () => {
    storage.guardar.mockResolvedValue({ archivoId: ARCHIVO_ID, path: "IMAGEN_CONTENIDO/x.png" })

    const res = await service.subir({
      contenido: PNG,
      nombreOriginal: "diagrama.png",
      subidoPorUsuarioId: USUARIO_ID,
    })

    expect(res).toEqual({
      archivoId: ARCHIVO_ID,
      url: `https://api.nexott.test/api/v1/imagenes/${ARCHIVO_ID}`,
    })
    expect(storage.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: "image/png",
        tipo: ArchivoTipo.IMAGEN_CONTENIDO,
        subidoPorUsuarioId: USUARIO_ID,
        metadata: expect.objectContaining({
          tipo: ArchivoTipo.IMAGEN_CONTENIDO,
          nombreOriginal: "diagrama.png",
        }),
      }),
    )
  })

  it("rechaza un archivo que no es imagen real (bytes que no matchean whitelist)", async () => {
    const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46])
    await expect(
      service.subir({
        contenido: elf,
        nombreOriginal: "virus.png",
        subidoPorUsuarioId: USUARIO_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(storage.guardar).not.toHaveBeenCalled()
  })
})

describe("ImagenesService.obtener", () => {
  it("delega en storage.leer acotando el tipo a IMAGEN_CONTENIDO (no expone otros archivos)", async () => {
    storage.leer.mockResolvedValue({ contenido: PNG, mimeType: "image/png" })
    const res = await service.obtener(ARCHIVO_ID)
    expect(res.mimeType).toBe("image/png")
    expect(storage.leer).toHaveBeenCalledWith(ARCHIVO_ID, [ArchivoTipo.IMAGEN_CONTENIDO])
  })

  it("propaga el 404 cuando el id apunta a un archivo de otro tipo", async () => {
    // StorageService rechaza (sin leer disco) si el tipo no está permitido.
    storage.leer.mockRejectedValue(new NotFoundException())
    await expect(service.obtener(ARCHIVO_ID)).rejects.toBeInstanceOf(NotFoundException)
  })
})
