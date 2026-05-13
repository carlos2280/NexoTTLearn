import { AdminShell } from "@/features/admin/layout/components/admin-shell"
import { ParticipanteShell } from "@/features/participante-layout/components/participante-shell"
import { AsignacionesPage } from "@/pages/admin/asignaciones/asignaciones.page"
import { CatalogoPage } from "@/pages/admin/catalogo/catalogo.page"
import { ModuloBuilderPage } from "@/pages/admin/catalogo/modulo-builder/modulo-builder.page"
import { CursoDetallePage } from "@/pages/admin/cursos/curso-detalle.page"
import { CursosPage } from "@/pages/admin/cursos/cursos.page"
import { InicioPage } from "@/pages/admin/inicio/inicio.page"
import { PersonasPage } from "@/pages/admin/personas/personas.page"
import { ProximamentePage } from "@/pages/admin/proximamente/proximamente.page"
import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { CuentaPage } from "@/pages/cuenta/cuenta.page"
import { LoginPage } from "@/pages/login/login.page"
import { LogoutPage } from "@/pages/logout/logout.page"
import { MisCursosPage } from "@/pages/mis-cursos/mis-cursos.page"
import { ParticipanteProximamentePage } from "@/pages/participante-proximamente/participante-proximamente.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardRol } from "./guard-rol"
import { GuardSesion } from "./guard-sesion"

const SEGMENTOS_ADMIN: readonly string[] = ["reportes", "sistema"]

export function AppRoutes() {
  return (
    <Routes>
      <Route path={RUTAS.login} element={<LoginPage />} />
      <Route path={RUTAS.logout} element={<LogoutPage />} />
      <Route
        element={
          <GuardSesion>
            <ParticipanteShell />
          </GuardSesion>
        }
      >
        <Route path={RUTAS.bandeja} element={<BandejaPage />} />
        <Route path={RUTAS.participante.misCursos} element={<MisCursosPage />} />
        <Route path={RUTAS.participante.miFicha} element={<ParticipanteProximamentePage />} />
        <Route path={RUTAS.participante.catalogo} element={<ParticipanteProximamentePage />} />
      </Route>
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
      {/*
        Builder de módulo: pantalla inmersiva fuera de AdminShell (sin menú
        lateral). Es la ÚNICA vista del detalle de módulo.
      */}
      <Route
        path="/admin/catalogo/modulos/:moduloId"
        element={
          <GuardSesion>
            <GuardRol permitidos={["ADMIN"]} redirigirA={RUTAS.bandeja}>
              <ModuloBuilderPage />
            </GuardRol>
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
        <Route
          path="clientes"
          element={<Navigate to="/admin/catalogo?tab=clientes" replace={true} />}
        />
        <Route path="cursos" element={<CursosPage />} />
        <Route path="cursos/:cursoId" element={<CursoDetallePage />} />
        <Route path="cursos/:cursoId/asignaciones" element={<AsignacionesPage />} />
        <Route path="personas" element={<PersonasPage />} />
        {SEGMENTOS_ADMIN.map((segmento) => (
          <Route key={segmento} path={segmento} element={<ProximamentePage />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={RUTAS.login} replace={true} />} />
    </Routes>
  )
}
