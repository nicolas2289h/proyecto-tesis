import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import MyLists from './pages/MyLists'
import ListDetail from './pages/ListDetail'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCatalog from './pages/admin/AdminCatalog'
import Layout from './components/Layout'
import AdminRoute from './components/AdminRoute'
import './index.css'
import { useAuthStore } from './store/authStore'

function DemoAutoLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const hasToken = useAuthStore((s) => !!s.token)
  useEffect(() => {
    const MOCK_ENABLED = false
    if (MOCK_ENABLED && !hasToken) {
      setAuth(
        { id: 1, email: 'demo@tesis.com', nombre: 'Usuario Demo', roles: ['USER'] },
        'demo-token-mock'
      )
    }
  }, [hasToken, setAuth])
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <DemoAutoLogin />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/home" element={
          <Layout>
            <Home />
          </Layout>
        } />
        <Route path="/mis-listas" element={
          <ProtectedRoute>
            <Layout>
              <MyLists />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/mis-listas/:id" element={
          <ProtectedRoute>
            <Layout>
              <ListDetail />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Rutas de Administración (CU-09 y CU-10) */}
        <Route path="/admin/usuarios" element={
          <AdminRoute>
            <Layout>
              <AdminUsers />
            </Layout>
          </AdminRoute>
        } />
        <Route path="/admin/catalogo" element={
          <AdminRoute>
            <Layout>
              <AdminCatalog />
            </Layout>
          </AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
