import { BrowserRouter } from "react-router-dom"
import { QueryProvider } from "./providers/query.provider"
import { AppRoutes } from "./router/routes"

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryProvider>
  )
}
