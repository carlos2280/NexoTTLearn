import { describe, expect, it } from "vitest"
import {
  type ArchivoLeido,
  type LimitesEmpaquetado,
  debeIncluirArchivo,
  empaquetarArchivos,
  esArchivoTexto,
  esRutaIgnorada,
} from "./empaquetar-repo"

describe("esRutaIgnorada", () => {
  it.each(["node_modules/x.js", "src/.git/config", "dist/main.js", "a/coverage/b.ts"])(
    "ignora %s",
    (ruta) => expect(esRutaIgnorada(ruta)).toBe(true),
  )
  it("no ignora código normal", () => {
    expect(esRutaIgnorada("src/app/main.ts")).toBe(false)
  })
})

describe("esArchivoTexto", () => {
  it.each(["src/a.ts", "README.md", "Dockerfile", "q.sql", "schema.prisma", ".gitignore"])(
    "incluye %s",
    (ruta) => expect(esArchivoTexto(ruta)).toBe(true),
  )
  it.each(["logo.png", "foto.jpg", "app.wasm", "bin.exe"])("excluye binario %s", (ruta) =>
    expect(esArchivoTexto(ruta)).toBe(false),
  )
})

describe("debeIncluirArchivo", () => {
  const limites: LimitesEmpaquetado = { maxArchivos: 10, maxBytesTotal: 1000, maxBytesArchivo: 100 }

  it("incluye texto dentro del tope por archivo", () => {
    expect(debeIncluirArchivo("src/a.ts", 50, limites)).toBe(true)
  })
  it("excluye archivo vacío", () => {
    expect(debeIncluirArchivo("src/a.ts", 0, limites)).toBe(false)
  })
  it("excluye archivo que supera el tope por archivo", () => {
    expect(debeIncluirArchivo("src/a.ts", 500, limites)).toBe(false)
  })
  it("excluye lockfile aunque sea texto", () => {
    expect(debeIncluirArchivo("pnpm-lock.yaml", 50, limites)).toBe(false)
  })
  it("excluye ruta ignorada", () => {
    expect(debeIncluirArchivo("node_modules/a.ts", 50, limites)).toBe(false)
  })
})

describe("empaquetarArchivos", () => {
  const a = (ruta: string, contenido: string): ArchivoLeido => ({
    ruta,
    contenido,
    bytes: contenido.length,
  })

  it("ordena por ruta y arma el bloque con encabezados", () => {
    const r = empaquetarArchivos([a("b.ts", "beta"), a("a.ts", "alfa")])
    expect(r.archivosIncluidos).toBe(2)
    expect(r.truncado).toBe(false)
    expect(r.contenido).toBe("===== a.ts =====\nalfa\n\n===== b.ts =====\nbeta")
  })

  it("trunca por número máximo de archivos", () => {
    const limites: LimitesEmpaquetado = {
      maxArchivos: 1,
      maxBytesTotal: 9999,
      maxBytesArchivo: 999,
    }
    const r = empaquetarArchivos([a("a.ts", "x"), a("b.ts", "y")], limites)
    expect(r.archivosIncluidos).toBe(1)
    expect(r.truncado).toBe(true)
  })

  it("trunca por bytes totales", () => {
    const limites: LimitesEmpaquetado = { maxArchivos: 99, maxBytesTotal: 6, maxBytesArchivo: 999 }
    const r = empaquetarArchivos([a("a.ts", "aaaa"), a("b.ts", "bbbb")], limites)
    expect(r.archivosIncluidos).toBe(1)
    expect(r.bytesTotales).toBe(4)
    expect(r.truncado).toBe(true)
  })
})
