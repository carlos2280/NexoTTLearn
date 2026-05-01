/**
 * Servidor Express minimal para servir la SPA Vite en produccion (Railway).
 *
 * Responsabilidades:
 * - Servir archivos estaticos de dist/ con cache headers correctos.
 * - Fallback SPA: cualquier ruta no-existente devuelve index.html (para react-router).
 * - Endpoint /healthz para healthcheck de Railway.
 * - Cabeceras de seguridad basicas (helmet).
 *
 * No corre en dev (eso es vite). Solo en build de produccion.
 */
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const express = require("express")
const helmet = require("helmet")
const compression = require("compression")

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, "dist")

const app = express()
const port = Number(process.env.PORT ?? 8080)

app.disable("x-powered-by")
app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use(
  express.static(distPath, {
    index: false,
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      }
    },
  }),
)

app.get("*", (_req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate")
  res.sendFile(path.join(distPath, "index.html"))
})

app.listen(port, "0.0.0.0", () => {
  console.info(`[web] sirviendo SPA en puerto ${port} desde ${distPath}`)
})
