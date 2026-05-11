import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { LoginPage } from "@/pages/login/login.page"
import { LogoutPage } from "@/pages/logout/logout.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardSesion } from "./guard-sesion"

export function AppRoutes() {
  return (
    <Routes>
      <Route path={RUTAS.login} element={<LoginPage />} />
      <Route path={RUTAS.logout} element={<LogoutPage />} />
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
