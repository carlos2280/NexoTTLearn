import { BandejaAdminPage } from "@/pages/admin/bandeja/bandeja-admin.page"
import { CursoEditarPage } from "@/pages/admin/cursos/curso-editar.page"
import { CursosAdminPage } from "@/pages/admin/cursos/cursos-admin.page"
import { ModuloSeccionesPage } from "@/pages/admin/cursos/modulo-secciones.page"
import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { CambiarPasswordPage } from "@/pages/cambiar-password/cambiar-password.page"
import { LoginPage } from "@/pages/login/login.page"
import { MfaPage } from "@/pages/login/mfa.page"
import { RecuperarPasswordPage } from "@/pages/recuperar-password/recuperar-password.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardCambioPassword } from "./guards/guard-cambio-password"
import { GuardRol } from "./guards/guard-rol"
import { GuardSesion } from "./guards/guard-sesion"
import { LayoutAdmin } from "./layouts/layout-admin"
import { LayoutParticipante } from "./layouts/layout-participante"

export function AppRoutes() {
  return (
    <Routes>
      {/* Publicas */}
      <Route path={RUTAS.login} element={<LoginPage />} />
      <Route path={RUTAS.loginMfa} element={<MfaPage />} />
      <Route path={RUTAS.recuperarPassword} element={<RecuperarPasswordPage />} />

      {/* Protegidas: requieren sesion */}
      <Route element={<GuardSesion />}>
        {/* Cambio de password obligatorio (no pasa por GuardCambioPassword) */}
        <Route path={RUTAS.cambiarPassword} element={<CambiarPasswordPage />} />

        {/* Rutas que se bloquean si debeCambiarPassword=true */}
        <Route element={<GuardCambioPassword />}>
          {/* Participante */}
          <Route element={<LayoutParticipante />}>
            <Route path={RUTAS.bandeja} element={<BandejaPage />} />
          </Route>

          {/* Admin */}
          <Route element={<GuardRol rol="ADMIN" />}>
            <Route element={<LayoutAdmin />}>
              <Route path={RUTAS.admin.bandeja} element={<BandejaAdminPage />} />
              <Route path={RUTAS.admin.cursos} element={<CursosAdminPage />} />
              <Route path={RUTAS.admin.cursoNuevo} element={<CursoEditarPage />} />
              <Route path={RUTAS.admin.cursoEditar(":id")} element={<CursoEditarPage />} />
              <Route
                path={RUTAS.admin.cursoModuloSecciones(":id", ":moduloId")}
                element={<ModuloSeccionesPage />}
              />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Catch-all: redirigir a bandeja (que a su vez requiere sesion) */}
      <Route path="*" element={<Navigate to={RUTAS.bandeja} replace={true} />} />
    </Routes>
  )
}
