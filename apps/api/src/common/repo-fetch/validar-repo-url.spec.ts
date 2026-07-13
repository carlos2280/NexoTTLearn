import { describe, expect, it } from "vitest"
import { validarRepoUrl } from "./validar-repo-url"

describe("validarRepoUrl", () => {
  it("acepta un repo público de GitHub y lo normaliza", () => {
    const r = validarRepoUrl("https://github.com/owner/mi-repo")
    expect(r).toEqual({ ok: true, url: "https://github.com/owner/mi-repo" })
  })

  it("acepta GitLab y recorta el sufijo .git, query y hash", () => {
    const r = validarRepoUrl("https://gitlab.com/owner/mi-repo.git?ref=main#readme")
    expect(r).toEqual({ ok: true, url: "https://gitlab.com/owner/mi-repo" })
  })

  it.each([
    ["http (no https)", "http://github.com/owner/repo"],
    ["ssh", "ssh://git@github.com/owner/repo"],
    ["file", "file:///etc/passwd"],
    ["host no permitido", "https://evil.com/owner/repo"],
    ["IP interna", "https://169.254.169.254/owner/repo"],
    ["localhost", "https://localhost/owner/repo"],
    ["con credenciales", "https://user:pass@github.com/owner/repo"],
    ["con puerto", "https://github.com:22/owner/repo"],
    ["sin owner/repo", "https://github.com/soloOwner"],
    ["basura", "no-es-una-url"],
  ])("rechaza %s", (_caso, entrada) => {
    const r = validarRepoUrl(entrada)
    expect(r.ok).toBe(false)
  })
})
