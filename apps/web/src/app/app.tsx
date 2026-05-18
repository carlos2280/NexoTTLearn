import { ThemeSync } from "@/shared/components/ui/theme-sync"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"
import { QueryProvider } from "./providers/query.provider"
import { AppRoutes } from "./router/routes"

export function App() {
  return (
    <QueryProvider>
      <ThemeSync />
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          duration={4000}
          closeButton={true}
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              boxShadow: "var(--shadow-md)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-body-sm)",
            },
          }}
        />
      </BrowserRouter>
    </QueryProvider>
  )
}
