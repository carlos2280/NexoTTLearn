import { ApiError } from "@/shared/api/api-error"
import { setCsrfToken } from "@/shared/api/csrf"
import { afterEach, describe, expect, it, vi } from "vitest"
import { subirImagen } from "./subir-imagen.api"

function respuestaOk(body: unknown): Response {
  return {
    ok: true,
    status: 201,
    statusText: "Created",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response
}

function respuestaError(status: number, body: unknown): Response {
  return {
    ok: false,
    status,
    statusText: "Error",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  setCsrfToken(null)
})

describe("subirImagen", () => {
  it("envía multipart con el token CSRF y devuelve la respuesta validada", async () => {
    setCsrfToken("token-csrf")
    const archivoId = "00000000-0000-4000-8000-000000000001"
    const url = `https://api.test/api/v1/imagenes/${archivoId}`
    const fetchMock = vi.fn().mockResolvedValue(respuestaOk({ archivoId, url }))
    vi.stubGlobal("fetch", fetchMock)

    const png = new File([new Uint8Array([0x89, 0x50])], "foto.png", { type: "image/png" })
    const resultado = await subirImagen(png)

    expect(resultado).toEqual({ archivoId, url })
    const opciones = fetchMock.mock.calls[0]?.[1] as {
      method: string
      credentials: string
      headers: Record<string, string>
      body: unknown
    }
    expect(opciones.method).toBe("POST")
    expect(opciones.credentials).toBe("include")
    expect(opciones.headers["X-XSRF-TOKEN"]).toBe("token-csrf")
    expect(opciones.body).toBeInstanceOf(FormData)
  })

  it("lanza ApiError con el code del backend cuando la respuesta no es ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          respuestaError(413, { code: "IMAGEN_DEMASIADO_GRANDE", message: "Muy grande" }),
        ),
    )
    const png = new File([new Uint8Array([0x89])], "foto.png", { type: "image/png" })
    await expect(subirImagen(png)).rejects.toMatchObject({ code: "IMAGEN_DEMASIADO_GRANDE" })
    await expect(subirImagen(png)).rejects.toBeInstanceOf(ApiError)
  })
})
