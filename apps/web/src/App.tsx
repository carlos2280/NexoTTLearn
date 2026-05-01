import { Navigate, Route, Routes } from "react-router-dom"
import { RutaProtegida } from "./components/auth/RutaProtegida"
import { InicioPage } from "./pages/InicioPage"
import { LoginPage } from "./pages/auth/LoginPage"

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RutaProtegida>
            <InicioPage />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace={true} />} />
    </Routes>
  )
}
