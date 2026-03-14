import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Plus, Scan, CheckCircle, XCircle, Clock, X, Network, Bug, Box, StopCircle, Reply, RefreshCw } from 'lucide-react'
import { scans } from '../lib/api'
import { useProjects } from '../context/ProjectContext'

interface Scan {
  id: number
  name: string
  scan_type: string
  targets: string
  status: string
  progress: number
  created_at: string
}

const scanTools = [
  { 
    id: 'nmap', 
    label: 'Nmap', 
    description: 'Network discovery and security auditing tool for large networks.',
    icon: Network,
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10'
  },
  { 
    id: 'nuclei', 
    label: 'Nuclei', 
    description: 'Fast and customizable vulnerability scanner based on simple YAML based DSL.',
    icon: Bug,
    color: '#f97316',
    bgColor: 'bg-orange-500/10'
  },
  { 
    id: 'trivy', 
    label: 'Trivy', 
    description: 'Comprehensive and versatile security scanner for containers and artifacts.',
    icon: Box,
    color: '#a855f7',
    bgColor: 'bg-purple-500/10'
  },
]

export default function Scans() {
  const { selectedProject } = useProjects()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    scan_type: 'nmap',
    targets: '',
  })

  const { data: scansData } = useQuery({
    queryKey: ['scans', selectedProject?.id],
    queryFn: () => scans.list(selectedProject!.id),
    enabled: !!selectedProject,
    refetchInterval: 3000,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData & { project_id: number }) => scans.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', selectedProject?.id] })
      setShowForm(false)
      setFormData({ name: '', scan_type: 'nmap', targets: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    createMutation.mutate({ ...formData, project_id: selectedProject.id })
  }

  const scansList: Scan[] = scansData?.data || []
  const activeScans = scansList.filter(s => s.status === 'running' || s.status === 'pending')
  const completedScans = scansList.filter(s => s.status === 'completed' || s.status === 'failed')

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Scans</h1>
        <div className="card p-8 text-center">
          <Scan size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Please select a project to manage scans.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between px-8 pt-8">
        <h2 className="text-2xl font-bold">Vulnerability Scans</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#22c55e]/90 text-[#0f172a] px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={18} />
          New Scan
        </button>
      </div>

      {showForm && (
        <div className="mx-8 bg-[#1e293b] rounded-xl border border-slate-800 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Create New Scan</h3>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-800 rounded-lg">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Scan Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                placeholder="Weekly Production Scan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Scan Type</label>
              <div className="grid grid-cols-3 gap-3">
                {scanTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, scan_type: tool.id })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.scan_type === tool.id 
                        ? 'border-[#22c55e] bg-[#22c55e]/10' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${tool.bgColor} flex items-center justify-center mb-2`}>
                      <tool.icon size={20} style={{ color: tool.color }} />
                    </div>
                    <p className="font-medium text-white">{tool.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Targets</label>
              <input
                type="text"
                required
                value={formData.targets}
                onChange={(e) => setFormData({ ...formData, targets: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                placeholder="192.168.1.0/24 or example.com"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-900 font-bold px-6 py-2 rounded-lg">
                {createMutation.isPending ? 'Creating...' : 'Create Scan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {scanTools.map((tool) => (
            <div key={tool.id} className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-4`}>
                  <tool.icon size={24} style={{ color: tool.color }} />
                </div>
                <h3 className="text-lg font-bold mb-1 text-white">{tool.label}</h3>
                <p className="text-slate-400 text-sm mb-6">{tool.description}</p>
              </div>
              <button 
                onClick={() => {
                  setFormData({ ...formData, scan_type: tool.id, name: `${tool.label} Quick Scan` })
                  setShowForm(true)
                }}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 w-full py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Play size={16} />
                Run Scan
              </button>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <RefreshCw size={20} className="text-[#22c55e]" />
            Active Scans
          </h3>
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-sm text-slate-400">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Tool</th>
                  <th className="p-4 font-medium">Target</th>
                  <th className="p-4 font-medium w-1/4">Progress</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Started</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeScans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No active scans</td>
                  </tr>
                ) : (
                  activeScans.map((scan) => (
                    <tr key={scan.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-medium text-white">{scan.name}</td>
                      <td className="p-4 text-slate-300 capitalize">{scan.scan_type}</td>
                      <td className="p-4 text-slate-300">{scan.targets}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${scan.progress}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-400">{scan.progress}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          scan.status === 'running' 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${scan.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-slate-400'}`}></span>
                          {scan.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {scan.status === 'running' ? 'Running...' : 'Queued'}
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-slate-400 hover:text-red-400 transition-colors" title="Stop Scan">
                          <StopCircle size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Clock size={20} className="text-slate-400" />
            Scan History
          </h3>
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-sm text-slate-400">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Tool</th>
                  <th className="p-4 font-medium">Target</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-center">Findings</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium">Completed</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {completedScans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No scan history</td>
                  </tr>
                ) : (
                  completedScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-medium text-white">{scan.name}</td>
                      <td className="p-4 text-slate-300 capitalize">{scan.scan_type}</td>
                      <td className="p-4 text-slate-300">{scan.targets}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          scan.status === 'completed' 
                            ? 'bg-[#22c55e]/10 text-[#22c55e]' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {scan.status === 'completed' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {scan.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {scan.status === 'completed' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-500/10 text-orange-400 font-bold text-xs">
                            {Math.floor(Math.random() * 20)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-slate-400">
                        {scan.status === 'completed' ? `${Math.floor(Math.random() * 10)}m ${Math.floor(Math.random() * 60)}s` : '-'}
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {scan.status === 'completed' && (
                            <button className="text-[#22c55e] hover:text-[#22c55e]/80 transition-colors text-sm font-medium">View Results</button>
                          )}
                          <button className="text-slate-400 hover:text-slate-200 transition-colors" title="Re-run">
                            <Reply size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
