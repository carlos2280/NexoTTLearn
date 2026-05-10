import { Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "@/pages/login/login.page"
import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { RUTAS } from "@/shared/constants/rutas"
import { GuardSesion } from "./guard-sesion"

export function AppRoutes() {
  return (
    <Routes>
      <Route path={RUTAS.login} element={<LoginPage />} />
      <Route
        path={RUTAS.bandeja}
        element={
          <GuardSesion>
            <BandejaPage />
          </GuardSesion>
        }
      />
      <Route
        path={RUTAS.admin.bandeja}
        element={
          <GuardSesion>
            <BandejaPage />
          </GuardSesion>
        }
      />
      <Route path="*" element={<Navigate to={RUTAS.login} replace={true} />} />
    </Routes>
  )
}
