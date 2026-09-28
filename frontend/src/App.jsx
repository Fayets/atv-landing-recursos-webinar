import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Admin from './pages/Admin.jsx'
import Inicio from './pages/Inicio.jsx'
import Recurso from './pages/Recurso.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/backend" element={<Navigate to="/back-end" replace />} />
        <Route path="/:area" element={<Recurso />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
