import { AdminShell } from "@/features/admin/layout/components/admin-shell"
import { AsignacionesPage } from "@/pages/admin/asignaciones/asignaciones.page"
import { CatalogoPage } from "@/pages/admin/catalogo/catalogo.page"
import { ModuloDetallePage } from "@/pages/admin/catalogo/modulo-detalle/modulo-detalle.page"
import { CursoDetallePage } from "@/pages/admin/cursos/curso-detalle.page"
import { CursosPage } from "@/pages/admin/cursos/cursos.page"
import { InicioPage } from "@/pages/admin/inicio/inicio.page"
import { ProximamentePage } from "@/pages/admin/proximamente/proximamente.page"
import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { CuentaPage } from "@/pages/cuenta/cuenta.page"
import { LoginPage } from "@/pages/login/login.page"
import { LogoutPage } from "@/pages/logout/logout.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardRol } from "./guard-rol"
import { GuardSesion } from "./guard-sesion"

const SEGMENTOS_ADMIN: readonly string[] = ["personas", "clientes", "reportes", "sistema"]

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
        path={RUTAS.cuenta}
        element={
          <GuardSesion>
            <div className="min-h-full bg-bg px-6 py-10">
              <CuentaPage />
            </div>
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
        <Route path="catalogo/modulos/:moduloId" element={<ModuloDetallePage />} />
        <Route path="cursos" element={<CursosPage />} />
        <Route path="cursos/:cursoId" element={<CursoDetallePage />} />
        <Route path="cursos/:cursoId/asignaciones" element={<AsignacionesPage />} />
        {SEGMENTOS_ADMIN.map((segmento) => (
          <Route key={segmento} path={segmento} element={<ProximamentePage />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={RUTAS.login} replace={true} />} />
    </Routes>
  )
}
