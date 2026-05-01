import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "./App"
import "@carlos2280/nexott-ui/tokens"
import "@carlos2280/nexott-ui/themes/nexott-learn/nexott-learn.css"
import "@carlos2280/nexott-ui/animations"
import "@carlos2280/nexott-ui/utilities"
import "@carlos2280/nexott-ui/react-primitives/primitives.css"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("No se encontro el elemento root")
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
