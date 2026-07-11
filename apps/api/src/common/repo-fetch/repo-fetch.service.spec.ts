import { UnprocessableEntityException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { RepoFetchService } from "./repo-fetch.service"

describe("RepoFetchService.descargarYEmpaquetar", () => {
  const service = new RepoFetchService()

  // Gate anti-SSRF: la validación corre ANTES de crear el temporal o clonar,
  // así que estos casos no tocan red ni disco.
  it.each([
    ["host no permitido", "https://evil.com/owner/repo"],
    ["http (no https)", "http://github.com/owner/repo"],
    ["IP interna", "https://169.254.169.254/a/b"],
    ["con credenciales", "https://user:pass@github.com/owner/repo"],
    ["sin owner/repo", "https://github.com/soloOwner"],
  ])("rechaza %s con repoUrlInvalida y sin clonar", async (_caso, url) => {
    let capturado: unknown
    try {
      await service.descargarYEmpaquetar(url)
    } catch (error) {
      capturado = error
    }
    expect(capturado).toBeInstanceOf(UnprocessableEntityException)
    expect((capturado as UnprocessableEntityException).getResponse()).toMatchObject({
      code: apiErrorCodes.repoUrlInvalida,
    })
  })
})
