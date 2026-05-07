import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app/app"
import "./styles/globals.css"
import "@carlos2280/nexott-ui/tokens"
import "@carlos2280/nexott-ui/themes/nexott-learn/nexott-learn.css"
import "@carlos2280/nexott-ui/animations"
import "@carlos2280/nexott-ui/utilities"
import "@carlos2280/nexott-ui/react-primitives/primitives.css"
import "./index.css"

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("No se encontro el elemento root")
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
