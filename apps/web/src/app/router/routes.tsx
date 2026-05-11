import { AdminShell } from "@/features/admin/layout/components/admin-shell"
import { CatalogoPage } from "@/pages/admin/catalogo/catalogo.page"
import { InicioPage } from "@/pages/admin/inicio/inicio.page"
import { ProximamentePage } from "@/pages/admin/proximamente/proximamente.page"
import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { LoginPage } from "@/pages/login/login.page"
import { LogoutPage } from "@/pages/logout/logout.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardRol } from "./guard-rol"
import { GuardSesion } from "./guard-sesion"

const SEGMENTOS_ADMIN: readonly string[] = ["cursos", "personas", "clientes", "reportes", "sistema"]

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
        path={RUTAS.admin.inicio}
        element={
          <GuardSesion>
            <GuardRol permitidos={["ADMIN"]} redirigirA={RUTAS.bandeja}>
              <AdminShell />
            </GuardRol>
          </GuardSesion>
        }
      >
        <Route index={true} element={<InicioPage />} />
        <Route path="catalogo" element={<CatalogoPage />} />
        {SEGMENTOS_ADMIN.map((segmento) => (
          <Route key={segmento} path={segmento} element={<ProximamentePage />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={RUTAS.login} replace={true} />} />
    </Routes>
  )
}
