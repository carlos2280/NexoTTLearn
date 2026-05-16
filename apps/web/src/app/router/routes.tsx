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
import { AvanceCursoPage } from "@/pages/admin/reportes/avance-curso/avance-curso.page"
import { BrechasDetectadasPage } from "@/pages/admin/reportes/brechas-detectadas/brechas-detectadas.page"
import { DetalleColaboradorPage } from "@/pages/admin/reportes/detalle-colaborador/detalle-colaborador.page"
import { EficaciaPlataformaPage } from "@/pages/admin/reportes/eficacia-plataforma/eficacia-plataforma.page"
import { HistoricoClientePage } from "@/pages/admin/reportes/historico-cliente/historico-cliente.page"
import { InventarioSkillsPage } from "@/pages/admin/reportes/inventario-skills/inventario-skills.page"
import { ReportesPage } from "@/pages/admin/reportes/reportes.page"
import { ReutilizacionCatalogoPage } from "@/pages/admin/reportes/reutilizacion-catalogo/reutilizacion-catalogo.page"
import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { CatalogoPage as CatalogoParticipantePage } from "@/pages/catalogo/catalogo.page"
import { CuentaPage } from "@/pages/cuenta/cuenta.page"
import { CursoCerradoPage } from "@/pages/curso-cerrado/curso-cerrado.page"
import { CursoInmersivoPage } from "@/pages/curso-inmersivo/curso-inmersivo.page"
import { LoginPage } from "@/pages/login/login.page"
import { LogoutPage } from "@/pages/logout/logout.page"
import { MiFichaPage } from "@/pages/mi-ficha/mi-ficha.page"
import { MisCursosPage } from "@/pages/mis-cursos/mis-cursos.page"
import { PlaygroundPage } from "@/pages/playground/playground.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardRol } from "./guard-rol"
import { GuardSesion } from "./guard-sesion"

const SEGMENTOS_ADMIN: readonly string[] = ["sistema"]

export function AppRoutes() {
  return (
    <Routes>
      <Route path={RUTAS.login} element={<LoginPage />} />
      <Route path={RUTAS.logout} element={<LogoutPage />} />
      <Route path={RUTAS.playground} element={<PlaygroundPage />} />
      <Route
        element={
          <GuardSesion>
            <ParticipanteShell />
          </GuardSesion>
        }
      >
        <Route path={RUTAS.bandeja} element={<BandejaPage />} />
        <Route path={RUTAS.participante.misCursos} element={<MisCursosPage />} />
        <Route path={RUTAS.participante.miFicha} element={<MiFichaPage />} />
        <Route path={RUTAS.participante.catalogo} element={<CatalogoParticipantePage />} />
      </Route>
      {/*
        Curso cerrado (pantalla 08): ceremonia del veredicto. Ruta dedicada
        fuera del ParticipanteShell y del inmersivo. Se declara ANTES de
        `/cursos/:cursoId` por especificidad (rutas mas largas primero).
      */}
      <Route
        path="/cursos/:cursoId/cerrado"
        element={
          <GuardSesion>
            <CursoCerradoPage />
          </GuardSesion>
        }
      />
      {/*
        Curso inmersivo del participante: pantalla a pantalla completa fuera
        del ParticipanteShell — espejo del builder admin pero para consumir,
        no editar. Es el corazón del producto (D-INMERSIVO-1).
      */}
      <Route
        path="/cursos/:cursoId"
        element={
          <GuardSesion>
            <CursoInmersivoPage />
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
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="reportes/eficacia-plataforma" element={<EficaciaPlataformaPage />} />
        <Route path="reportes/inventario-skills" element={<InventarioSkillsPage />} />
        <Route path="reportes/avance-curso" element={<AvanceCursoPage />} />
        <Route path="reportes/historico-cliente" element={<HistoricoClientePage />} />
        <Route path="reportes/detalle-colaborador" element={<DetalleColaboradorPage />} />
        <Route path="reportes/brechas-detectadas" element={<BrechasDetectadasPage />} />
        <Route path="reportes/reutilizacion-catalogo" element={<ReutilizacionCatalogoPage />} />
        {SEGMENTOS_ADMIN.map((segmento) => (
          <Route key={segmento} path={segmento} element={<ProximamentePage />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={RUTAS.login} replace={true} />} />
    </Routes>
  )
}
