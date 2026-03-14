import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Server, 
  Bug, 
  Settings,
  ChevronDown,
  Plus,
  Shield,
  LogOut,
  Radar
} from 'lucide-react'
import { useProjects } from '../context/ProjectContext'
import { projects as projectsApi } from '../lib/api'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', icon: Server },
  { to: '/scans', label: 'Scans', icon: Radar },
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
    <aside className="w-64 flex-shrink-0 bg-[#0f172a] flex flex-col justify-between p-4 border-r border-slate-800">
      <div className="flex flex-col gap-6">
        <div className="flex gap-3 items-center px-2">
          <div className="bg-[#22c55e]/20 aspect-square rounded-full size-10 flex items-center justify-center text-[#22c55e]">
            <Shield size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-lg font-bold leading-tight">VSX</h1>
            <p className="text-slate-400 text-xs font-medium leading-tight">Vulnerability Management</p>
          </div>
        </div>

        <div className="px-2">
          <div className="relative">
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === Number(e.target.value))
                if (project) setSelectedProject(project)
              }}
              className="w-full px-3 py-2.5 rounded-lg appearance-none cursor-pointer text-sm bg-[#1e293b] border border-slate-700 text-white"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" 
            />
          </div>
          <button
            onClick={() => setShowProjectForm(!showProjectForm)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-sm py-2 rounded-lg transition-colors hover:bg-slate-800 text-slate-400"
          >
            <Plus size={14} />
            New Project
          </button>
          
          {showProjectForm && (
            <form onSubmit={handleCreateProject} className="mt-3 space-y-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-slate-700 text-white text-sm focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-900 font-medium py-2 rounded-lg text-sm"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectForm(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <nav className="flex flex-col gap-2 px-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#22c55e]/10 text-[#22c55e]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 px-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
