import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app/app"
import "./styles/globals.css"

const container = document.getElementById("root")
if (!container) {
  throw new Error("Elemento #root no encontrado")
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
