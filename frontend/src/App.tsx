import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Scans from './pages/Scans'
import Findings from './pages/Findings'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import { ProjectProvider } from './context/ProjectContext'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="assets" element={<Assets />} />
              <Route path="scans" element={<Scans />} />
              <Route path="findings" element={<Findings />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </QueryClientProvider>
  )
}

export default App
