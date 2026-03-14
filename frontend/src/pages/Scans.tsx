import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Plus, Trash2, Scan, CheckCircle, XCircle, Clock, X } from 'lucide-react'
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

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock size={14} />, color: '#71717a' },
  running: { icon: <Scan size={14} className="animate-pulse" />, color: '#3b82f6' },
  completed: { icon: <CheckCircle size={14} />, color: '#10b981' },
  failed: { icon: <XCircle size={14} />, color: '#ef4444' },
}

const scanTypes = [
  { value: 'nmap', label: 'Nmap', description: 'Port & service discovery', color: '#10b981' },
  { value: 'nuclei', label: 'Nuclei', description: 'Vulnerability detection', color: '#a855f7' },
  { value: 'trivy', label: 'Trivy', description: 'Container scanning', color: '#3b82f6' },
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

  const { data: scansData, isLoading } = useQuery({
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

  const executeMutation = useMutation({
    mutationFn: (id: number) => scans.execute(selectedProject!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', selectedProject?.id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scans.delete(selectedProject!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', selectedProject?.id] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    createMutation.mutate({ ...formData, project_id: selectedProject.id })
  }

  const scansList: Scan[] = scansData?.data || []

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Scans</h1>
        <div className="card p-8 text-center">
          <Scan size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Please select a project to run scans.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scans</h1>
          <p style={{ color: 'var(--text-muted)' }}>Run vulnerability scans</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          New Scan
        </button>
      </div>

      {showForm && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Create New Scan</h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg">
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Scan Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Weekly Security Scan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Scanner Type</label>
              <div className="grid grid-cols-3 gap-3">
                {scanTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${formData.scan_type === type.value ? 'border-green-500 bg-green-500/10' : 'border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}
                  >
                    <input
                      type="radio"
                      name="scan_type"
                      value={type.value}
                      checked={formData.scan_type === type.value}
                      onChange={(e) => setFormData({ ...formData, scan_type: e.target.value })}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <p className="font-semibold text-white">{type.label}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Targets</label>
              <input
                type="text"
                required
                value={formData.targets}
                onChange={(e) => setFormData({ ...formData, targets: e.target.value })}
                className="input"
                placeholder={formData.scan_type === 'trivy' ? 'nginx:latest' : '192.168.1.0/24 or example.com'}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                {createMutation.isPending ? 'Creating...' : 'Create Scan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="card p-8 text-center">
          <p style={{ color: 'var(--text-muted)' }}>Loading scans...</p>
        </div>
      ) : scansList.length === 0 ? (
        <div className="card p-8 text-center">
          <Scan size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No scans yet. Start your first scan.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Targets</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scansList.map((scan) => {
                  const status = statusConfig[scan.status] || statusConfig.pending
                  return (
                    <tr key={scan.id}>
                      <td>
                        <p className="font-medium text-white">{scan.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td>
                        <span className="capitalize text-white">{scan.scan_type}</span>
                      </td>
                      <td>
                        <code className="text-sm px-2 py-1 rounded" style={{ background: 'var(--bg-tertiary)' }}>{scan.targets}</code>
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <span style={{ color: status.color }}>{status.icon}</span>
                          <span className="capitalize" style={{ color: status.color }}>{scan.status}</span>
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar w-24">
                            <div className="progress-fill" style={{ width: `${scan.progress}%` }} />
                          </div>
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{scan.progress}%</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {scan.status !== 'running' && (
                            <button
                              onClick={() => executeMutation.mutate(scan.id)}
                              className="p-2 rounded-lg hover:bg-green-500/10 transition-colors"
                              title="Run scan"
                            >
                              <Play size={16} className="text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(scan.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Delete scan"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
