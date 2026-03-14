import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Server, Scan, Bug, Settings, ChevronDown, Plus } from 'lucide-react'
import { useProjects } from '../context/ProjectContext'
import { projects as projectsApi } from '../lib/api'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', icon: Server },
  { to: '/scans', label: 'Scans', icon: Scan },
  { to: '/findings', label: 'Findings', icon: Bug },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { projects, selectedProject, setSelectedProject, refreshProjects } = useProjects()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

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

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-brand-400">vscx</h1>
        <p className="text-xs text-slate-400">Vulnerability Scanner</p>
      </div>

      <div className="p-4 border-b border-slate-800">
        <div className="relative">
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === Number(e.target.value))
              if (project) setSelectedProject(project)
            }}
            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg appearance-none cursor-pointer pr-8"
          >
            {projects.length === 0 ? (
              <option value="">No projects</option>
            ) : (
              projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))
            )}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
        <button
          onClick={() => setShowProjectForm(!showProjectForm)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Plus size={14} />
          New Project
        </button>
        
        {showProjectForm && (
          <form onSubmit={handleCreateProject} className="mt-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg text-sm"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 bg-brand-600 text-white px-3 py-1 rounded text-sm hover:bg-brand-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowProjectForm(false)}
                className="flex-1 bg-slate-700 text-white px-3 py-1 rounded text-sm hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
