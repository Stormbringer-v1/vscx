import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Server, 
  Scan, 
  Bug, 
  Settings,
  ChevronDown,
  Plus,
  Shield,
  LogOut
} from 'lucide-react'
import { useProjects } from '../context/ProjectContext'
import { projects as projectsApi } from '../lib/api'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', icon: Server },
  { to: '/scans', label: 'Scans', icon: Scan },
  { to: '/findings', label: 'Findings', icon: Bug },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { projects, selectedProject, setSelectedProject, refreshProjects } = useProjects()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const location = useLocation()

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    try {
      await projectsApi.create({ name: newProjectName })
      await refreshProjects()
      setNewProjectName('')
      setShowProjectForm(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 flex flex-col h-full" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
      <div className="p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">vscx</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vulnerability Scanner</p>
          </div>
        </div>
      </div>

      <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="relative">
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === Number(e.target.value))
              if (project) setSelectedProject(project)
            }}
            className="w-full px-3 py-2.5 rounded-lg appearance-none cursor-pointer text-sm"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {projects.length === 0 ? (
              <option value="">No projects</option>
            ) : (
              projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))
            )}
          </select>
          <ChevronDown 
            size={16} 
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" 
            style={{ color: 'var(--text-muted)' }} 
          />
        </div>
        <button
          onClick={() => setShowProjectForm(!showProjectForm)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-sm py-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
        >
          <Plus size={14} />
          New Project
        </button>
        
        {showProjectForm && (
          <form onSubmit={handleCreateProject} className="mt-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="input text-sm"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 btn btn-primary text-xs py-2"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowProjectForm(false)}
                className="flex-1 btn btn-secondary text-xs py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'text-white'
                  : 'hover:bg-white/5'
              }`}
              style={{ 
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
              }}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}
